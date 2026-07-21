"""Parquet discovery, schema checking, and decoding."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

import pyarrow.parquet as pq

from .models import PipelineReport, RawRecord

REQUIRED_COLUMNS = ("user_id", "match_id", "map_id", "x", "y", "z", "ts", "event")


def discover_parquet_files(data_root: Path) -> list[Path]:
    """Finds all extension-less Parquet telemetry partitions in a stable order."""
    return sorted(data_root.glob("February_*/*.nakama-0"), key=lambda path: path.as_posix())


def timestamp_tick(value: object) -> int:
    """Returns the raw numeric timestamp tick without accepting wall-clock semantics.

    The dataset's `timestamp[ms]` annotation conflicts with its observed values. Relative
    tick differences are used as the telemetry timeline; absolute calendar time is not emitted.
    """
    if isinstance(value, datetime):
        return int(value.replace(tzinfo=timezone.utc).timestamp() * 1000)
    raise ValueError(f"Unsupported timestamp value {value!r}")


def decode_event(value: object) -> str:
    """Strictly decodes the schema's binary event field."""
    if isinstance(value, bytes):
        return value.decode("utf-8", "strict")
    if isinstance(value, str):
        return value
    raise ValueError(f"Event must be bytes or string, got {type(value).__name__}")


def read_records(paths: list[Path], report: PipelineReport) -> Iterator[RawRecord]:
    """Yields valid rows from readable partitions, recording corrupt files as warnings."""
    report.files_discovered = len(paths)
    for path in paths:
        try:
            schema = pq.read_schema(path)
            if tuple(schema.names) != REQUIRED_COLUMNS:
                raise ValueError(f"unexpected schema columns: {schema.names}")
            if any(schema.field(name).nullable for name in REQUIRED_COLUMNS):
                raise ValueError("nullable field in required production schema")
            table = pq.read_table(path).to_pydict()
            report.files_loaded += 1
        except Exception as error:  # Per-file resilience is intentional for future extracts.
            report.files_skipped += 1
            report.warn(f"Skipped unreadable partition {path.name}: {error}")
            continue
        for index in range(len(table["user_id"])):
            try:
                record = RawRecord(
                    user_id=str(table["user_id"][index]), match_id=str(table["match_id"][index]), map_id=str(table["map_id"][index]),
                    x=float(table["x"][index]), y=float(table["y"][index]), z=float(table["z"][index]),
                    tick=timestamp_tick(table["ts"][index]), event=decode_event(table["event"][index]),
                    source_day=path.parent.name, source_file=path, row_index=index,
                )
            except Exception as error:
                report.rows_skipped += 1
                report.warn(f"Skipped invalid row {path.name}:{index}: {error}")
                continue
            report.rows_loaded += 1
            yield record

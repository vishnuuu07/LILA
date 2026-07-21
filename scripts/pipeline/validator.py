"""Dataset invariants that prevent invalid data from reaching browser JSON."""
from __future__ import annotations

import math
import re
from collections import defaultdict
from typing import Iterable

from .models import PipelineReport, RawRecord

KNOWN_EVENTS = frozenset({"Position", "BotPosition", "Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"})
UUID = re.compile(r"^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$", re.I)


def is_bot(user_id: str) -> bool:
    """Implements the README-verified numeric identifier rule."""
    return user_id.isdecimal()


def validate_records(records: Iterable[RawRecord], report: PipelineReport, known_maps: set[str]) -> list[RawRecord]:
    """Drops invalid rows and duplicate player/match partitions with visible warnings."""
    accepted: list[RawRecord] = []
    partition_signature: dict[tuple[str, str], set[tuple[tuple[int, float, float, float, str], ...]]] = defaultdict(set)
    partitions: dict[tuple[str, str, str], list[RawRecord]] = defaultdict(list)
    for record in records:
        if record.map_id not in known_maps:
            report.rows_skipped += 1; report.warn(f"Unknown map {record.map_id} in {record.source_file.name}"); continue
        if record.event not in KNOWN_EVENTS:
            report.rows_skipped += 1; report.warn(f"Unknown event {record.event!r} in {record.source_file.name}"); continue
        if not all(math.isfinite(value) for value in (record.x, record.y, record.z)) or record.tick < 0:
            report.rows_skipped += 1; report.warn(f"Invalid coordinates/timestamp in {record.source_file.name}:{record.row_index}"); continue
        if not (is_bot(record.user_id) or UUID.match(record.user_id)):
            report.rows_skipped += 1; report.warn(f"Unclassified player ID {record.user_id!r}"); continue
        partitions[(record.user_id, record.match_id, record.source_file.as_posix())].append(record)
    for key in sorted(partitions):
        partition = sorted(partitions[key], key=lambda row: (row.tick, row.row_index))
        signature = tuple((row.tick, row.x, row.y, row.z, row.event) for row in partition)
        player_match = key[:2]
        if signature in partition_signature[player_match]:
            report.duplicate_partitions += 1
            report.warn(f"Skipped duplicate player-match partition {key[0]} / {key[1]}")
            continue
        if partition_signature[player_match]:
            report.warn(f"Merged non-identical repeated player-match partition {key[0]} / {key[1]}")
        partition_signature[player_match].add(signature)
        accepted.extend(partition)
    return accepted

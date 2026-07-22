"""Typed records shared by the ATLAS preprocessing stages."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class RawRecord:
    """One decoded telemetry row, retaining source provenance for warnings."""
    user_id: str
    match_id: str
    map_id: str
    x: float
    y: float
    z: float
    tick: int
    event: str
    source_day: str
    source_file: Path
    row_index: int


@dataclass(frozen=True)
class PixelRecord:
    """A validated telemetry row in the frontend's 1024-pixel map space."""
    raw: RawRecord
    pixel_x: float
    pixel_y: float


@dataclass
class PipelineReport:
    """Counts and non-fatal data-quality warnings emitted by the run."""
    files_discovered: int = 0
    files_loaded: int = 0
    files_skipped: int = 0
    rows_loaded: int = 0
    rows_skipped: int = 0
    duplicate_partitions: int = 0
    warnings: list[str] = field(default_factory=list)

    def warn(self, message: str) -> None:
        """Records a deterministic, human-readable warning."""
        self.warnings.append(message)

"""Generation of compact precomputed heatmap grids."""
from __future__ import annotations

from typing import Iterable

from .models import PixelRecord

GRID_SIZE = 32


def build_heatmap(records: Iterable[PixelRecord], kind: str) -> dict[str, object]:
    """Bins selected records into a normalized 32x32 intensity grid."""
    allowed = {
        "traffic": {"Position", "BotPosition"}, "kills": {"Kill", "BotKill"},
        "deaths": {"Killed", "BotKilled", "KilledByStorm"}, "loot": {"Loot"},
    }[kind]
    values = [0] * (GRID_SIZE * GRID_SIZE)
    for row in records:
        if row.raw.event not in allowed:
            continue
        x = min(GRID_SIZE - 1, max(0, int(row.pixel_x / 1024 * GRID_SIZE)))
        y = min(GRID_SIZE - 1, max(0, int(row.pixel_y / 1024 * GRID_SIZE)))
        values[y * GRID_SIZE + x] += 1
    peak = max(values, default=0)
    normalized = [round(value / peak, 4) if peak else 0 for value in values]
    return {"columns": GRID_SIZE, "rows": GRID_SIZE, "values": normalized}

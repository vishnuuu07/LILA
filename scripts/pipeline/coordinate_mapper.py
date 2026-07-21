"""Validated README world-to-minimap conversion."""
from __future__ import annotations

import math
from typing import Iterable

from .models import PixelRecord, PipelineReport, RawRecord

MAPS: dict[str, dict[str, object]] = {
    "AmbroseValley": {"name": "Ambrose Valley", "scale": 900.0, "origin_x": -370.0, "origin_z": -473.0, "image": "/minimaps/AmbroseValley_Minimap.png"},
    "GrandRift": {"name": "Grand Rift", "scale": 581.0, "origin_x": -290.0, "origin_z": -290.0, "image": "/minimaps/GrandRift_Minimap.png"},
    "Lockdown": {"name": "Lockdown", "scale": 1000.0, "origin_x": -500.0, "origin_z": -500.0, "image": "/minimaps/Lockdown_Minimap.jpg"},
}
LOGICAL_SIZE = 1024.0


def world_to_pixel(map_id: str, x: float, z: float) -> tuple[float, float]:
    """Maps a world X/Z pair into the renderer's top-left-origin 1024 space."""
    config = MAPS[map_id]
    pixel_x = (x - float(config["origin_x"])) / float(config["scale"]) * LOGICAL_SIZE
    pixel_y = (1.0 - (z - float(config["origin_z"])) / float(config["scale"])) * LOGICAL_SIZE
    return pixel_x, pixel_y


def pixel_to_world(map_id: str, pixel_x: float, pixel_y: float) -> tuple[float, float]:
    """Inverse transform used as a production gate for the conversion configuration."""
    config = MAPS[map_id]
    return (float(config["origin_x"]) + pixel_x / LOGICAL_SIZE * float(config["scale"]),
            float(config["origin_z"]) + (1.0 - pixel_y / LOGICAL_SIZE) * float(config["scale"]))


def validate_transform_configuration() -> None:
    """Fails fast if any map configuration cannot round-trip exactly."""
    for map_id in MAPS:
        for x, z in ((0.0, 0.0), (-123.5, 88.25), (500.0, -500.0)):
            px, py = world_to_pixel(map_id, x, z)
            x2, z2 = pixel_to_world(map_id, px, py)
            if math.hypot(x - x2, z - z2) > 1e-9:
                raise RuntimeError(f"Coordinate transform inverse failed for {map_id}")


def map_records(records: Iterable[RawRecord], report: PipelineReport) -> list[PixelRecord]:
    """Converts every accepted record and rejects any non-finite/out-of-bounds output."""
    pixels: list[PixelRecord] = []
    for record in records:
        pixel_x, pixel_y = world_to_pixel(record.map_id, record.x, record.z)
        if not (math.isfinite(pixel_x) and math.isfinite(pixel_y) and 0 <= pixel_x <= LOGICAL_SIZE and 0 <= pixel_y <= LOGICAL_SIZE):
            report.rows_skipped += 1
            report.warn(f"Out-of-bounds mapped coordinate in {record.source_file.name}:{record.row_index}")
            continue
        pixels.append(PixelRecord(raw=record, pixel_x=pixel_x, pixel_y=pixel_y))
    return pixels

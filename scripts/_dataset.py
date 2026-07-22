"""Shared, read-only helpers for the LILA telemetry discovery utilities."""
from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
import re

import numpy as np
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "player_data"
FILES = sorted(DATA.glob("February_*/*.nakama-0"))
(ROOT / "docs").mkdir(exist_ok=True)
MAP_CONFIG = {
    "AmbroseValley": {"scale": 900.0, "origin_x": -370.0, "origin_z": -473.0, "image": "AmbroseValley_Minimap.png"},
    "GrandRift": {"scale": 581.0, "origin_x": -290.0, "origin_z": -290.0, "image": "GrandRift_Minimap.png"},
    "Lockdown": {"scale": 1000.0, "origin_x": -500.0, "origin_z": -500.0, "image": "Lockdown_Minimap.jpg"},
}
UUID_RE = re.compile(r"^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$", re.I)


def decode(value):
    return value.decode("utf-8", "replace") if isinstance(value, bytes) else value


def is_bot(user_id: str) -> bool:
    return str(user_id).isdigit()


def ms(value) -> int:
    """Convert PyArrow/Pandas timestamp values to integer epoch milliseconds."""
    return int(value.astype("datetime64[ms]").astype("int64")) if isinstance(value, np.datetime64) else int(value.timestamp() * 1000)


def read_file(path: Path) -> dict:
    data = pq.read_table(path).to_pydict()
    data["event"] = [decode(v) for v in data["event"]]
    data["_file"] = [str(path.relative_to(ROOT))] * len(data["event"])
    return data


def iter_files():
    for path in FILES:
        yield path, read_file(path)


def world_to_pixel(map_id: str, x, z, logical_size: float = 1024.0):
    cfg = MAP_CONFIG[map_id]
    return ((np.asarray(x) - cfg["origin_x"]) / cfg["scale"] * logical_size,
            (1.0 - (np.asarray(z) - cfg["origin_z"]) / cfg["scale"]) * logical_size)


def pixel_to_world(map_id: str, px, py, logical_size: float = 1024.0):
    cfg = MAP_CONFIG[map_id]
    return (cfg["origin_x"] + np.asarray(px) / logical_size * cfg["scale"],
            cfg["origin_z"] + (1.0 - np.asarray(py) / logical_size) * cfg["scale"])


def markdown_table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    lines += ["| " + " | ".join(str(v).replace("|", "\\|") for v in row) + " |" for row in rows]
    return "\n".join(lines)


def ensure_dirs():
    (ROOT / "docs").mkdir(exist_ok=True)
    (ROOT / "docs" / "validation-assets").mkdir(parents=True, exist_ok=True)

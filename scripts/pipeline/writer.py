"""Deterministic output writing and frontend-contract verification."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable


def output_directories(root: Path) -> dict[str, Path]:
    """Creates and returns the canonical static-data directory tree."""
    data = root / "public" / "data"
    paths = {"data": data, "matches": data / "matches", "summaries": data / "summaries", "analytics": data / "analytics"}
    paths.update({kind: data / "heatmaps" / kind for kind in ("traffic", "kills", "deaths", "loot")})
    for path in paths.values(): path.mkdir(parents=True, exist_ok=True)
    return paths


def write_json(path: Path, payload: object) -> None:
    """Writes stable compact UTF-8 JSON with deterministic key ordering."""
    path.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")), encoding="utf-8")


def write_match_outputs(paths: dict[str, Path], match_id: str, match: dict[str, object], summary: dict[str, object], heatmaps: dict[str, dict[str, object]]) -> None:
    """Writes the browser match, summary, and all standalone heatmap artifacts."""
    filename = f"{match_id}.json"
    write_json(paths["matches"] / filename, match)
    write_json(paths["summaries"] / filename, summary)
    for kind, grid in heatmaps.items(): write_json(paths[kind] / filename, grid)


def verify_match_contract(matches: Iterable[dict[str, object]]) -> tuple[int, int, int]:
    """Validates the exact runtime essentials expected by `src/data/validation.ts`."""
    match_count = player_count = event_count = 0
    for match in matches:
        if not isinstance(match.get("matchId"), str) or not isinstance(match.get("mapId"), str) or not isinstance(match.get("duration"), (int, float)):
            raise ValueError("Generated match misses required identity/duration fields")
        players, events = match.get("players"), match.get("events")
        if not isinstance(players, list) or not isinstance(events, list): raise ValueError("Generated match misses players/events arrays")
        for player in players:
            if not isinstance(player, dict) or not isinstance(player.get("id"), str) or not isinstance(player.get("isBot"), bool) or not isinstance(player.get("journey"), list) or not player["journey"]:
                raise ValueError("Generated player fails TypeScript parser contract")
            for point in player["journey"]:
                if not isinstance(point, list) or len(point) < 3 or not all(isinstance(value, (int, float)) for value in point[:3]): raise ValueError("Generated journey point is invalid")
        for event in events:
            if not isinstance(event, dict) or not all(isinstance(event.get(key), expected) for key, expected in (("id", str), ("type", str), ("playerId", str))): raise ValueError("Generated event identity is invalid")
            if not all(isinstance(event.get(key), (int, float)) for key in ("t", "x", "y")): raise ValueError("Generated event coordinate is invalid")
        match_count += 1; player_count += len(players); event_count += len(events)
    return match_count, player_count, event_count

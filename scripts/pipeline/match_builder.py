"""Grouping into self-contained match documents."""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from .heatmap_generator import build_heatmap
from .models import PixelRecord
from .player_builder import build_events, build_players
from .statistics import build_statistics


def group_by_match(records: Iterable[PixelRecord]) -> dict[str, list[PixelRecord]]:
    """Groups all validated mapped rows by match identifier."""
    grouped: dict[str, list[PixelRecord]] = defaultdict(list)
    for record in records:
        grouped[record.raw.match_id].append(record)
    return grouped


def build_match(match_id: str, records: list[PixelRecord]) -> tuple[dict[str, object], dict[str, object], dict[str, dict[str, object]]]:
    """Builds match, summary, and standalone heatmap JSON objects from one match."""
    rows = sorted(records, key=lambda row: (row.raw.tick, row.raw.user_id, row.raw.row_index))
    map_ids = {row.raw.map_id for row in rows}
    if len(map_ids) != 1:
        raise ValueError(f"Match {match_id} spans multiple maps: {sorted(map_ids)}")
    match_start, match_end = rows[0].raw.tick, rows[-1].raw.tick
    duration = float(match_end - match_start)
    players = build_players(rows, match_start, duration)
    events = build_events(rows, match_id, match_start)
    event_ids_by_player: dict[str, list[str]] = defaultdict(list)
    for event in events:
        event_ids_by_player[str(event["playerId"])].append(str(event["id"]))
    for player in players:
        player["events"] = event_ids_by_player[str(player["id"])]
    statistics = build_statistics(rows, players, duration)
    heatmaps = {kind: build_heatmap(rows, kind) for kind in ("traffic", "kills", "deaths", "loot")}
    frames = _timeline(players, events, duration)
    date = min(row.raw.source_day for row in rows)
    match = {
        "matchId": match_id, "mapId": next(iter(map_ids)), "date": date, "duration": round(duration, 3),
        "players": players, "events": events, "statistics": statistics,
        "timeline": {"unit": "relative_tick_seconds", "frames": frames},
        "heatmaps": {key: heatmaps[key] for key in ("traffic", "kills", "deaths")},
    }
    summary = {"matchId": match_id, "mapId": match["mapId"], "date": date, "duration": match["duration"], "statistics": statistics}
    return match, summary, heatmaps


def _timeline(players: list[dict[str, object]], events: list[dict[str, object]], duration: float) -> list[dict[str, object]]:
    """Creates sparse playback frames at discrete event boundaries without duplicating paths."""
    times = sorted({0.0, round(duration, 3)} | {float(event["t"]) for event in events})
    event_at_time: dict[float, list[str]] = defaultdict(list)
    for event in events:
        event_at_time[float(event["t"])].append(str(event["id"]))
    frames: list[dict[str, object]] = []
    for time in times:
        active = [str(player["id"]) for player in players if float(player["spawnTime"]) <= time <= float(player["spawnTime"]) + float(player["survivalTime"])]
        frames.append({"timestamp": time, "activePlayers": active, "visibleEventIds": event_at_time[time]})
    return frames

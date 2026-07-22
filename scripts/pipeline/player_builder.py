"""Player-journey assembly from mapped telemetry rows."""
from __future__ import annotations

import math
from collections import defaultdict
from typing import Iterable

from .models import PixelRecord
from .validator import is_bot

MOVEMENT_EVENTS = frozenset({"Position", "BotPosition"})
DEATH_EVENTS = frozenset({"Killed", "BotKilled", "KilledByStorm"})


def _round(value: float) -> float:
    return round(value, 3)


def build_players(records: Iterable[PixelRecord], match_start: int, match_duration: float) -> list[dict[str, object]]:
    """Builds deterministically ordered, frontend-ready players for one match."""
    by_player: dict[str, list[PixelRecord]] = defaultdict(list)
    for record in records:
        by_player[record.raw.user_id].append(record)
    players: list[dict[str, object]] = []
    for player_id in sorted(by_player):
        rows = sorted(by_player[player_id], key=lambda row: (row.raw.tick, row.raw.row_index))
        journey_rows = [row for row in rows if row.raw.event in MOVEMENT_EVENTS]
        if not journey_rows:
            journey_rows = rows[:1]
        journey = [[_round(row.pixel_x), _round(row.pixel_y), round((row.raw.tick - match_start), 3)] for row in journey_rows]
        path_length = sum(math.hypot(float(current[0]) - float(previous[0]), float(current[1]) - float(previous[1])) for previous, current in zip(journey, journey[1:]))
        event_rows = [row for row in rows if row.raw.event not in MOVEMENT_EVENTS]
        spawn_time = round(rows[0].raw.tick - match_start, 3)
        death_rows = [row for row in event_rows if row.raw.event in DEATH_EVENTS]
        death_time = round(death_rows[-1].raw.tick - match_start, 3) if death_rows else None
        end_time = death_time if death_time is not None else round(match_duration, 3)
        players.append({
            "id": player_id,
            "isBot": is_bot(player_id),
            "actorType": "bot" if is_bot(player_id) else "human",
            "journey": journey,
            "events": [],
            "spawnTime": spawn_time,
            "deathTime": death_time,
            "survivalTime": round(max(0.0, end_time - spawn_time), 3),
            "eventCount": len(event_rows),
            "pathLength": round(path_length, 3),
        })
    return players


def build_events(records: Iterable[PixelRecord], match_id: str, match_start: int) -> list[dict[str, object]]:
    """Normalizes discrete, location-bearing events and assigns stable IDs."""
    events: list[dict[str, object]] = []
    rows = sorted((row for row in records if row.raw.event not in MOVEMENT_EVENTS), key=lambda row: (row.raw.tick, row.raw.user_id, row.raw.row_index))
    for sequence, row in enumerate(rows):
        time = round(row.raw.tick - match_start, 3)
        events.append({
            "id": f"{match_id}:{row.raw.user_id}:{time:g}:{sequence}",
            "type": row.raw.event,
            "playerId": row.raw.user_id,
            "t": time,
            "x": _round(row.pixel_x),
            "y": _round(row.pixel_y),
            "details": {"actorType": "bot" if is_bot(row.raw.user_id) else "human"},
        })
    return events

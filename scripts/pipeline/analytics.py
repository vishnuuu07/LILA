"""One-pass aggregate artifacts used by the Analytics Workbench."""
from __future__ import annotations

from collections import defaultdict
from typing import Any

GRID = 32
ENTITY_KEYS = ("humans", "bots", "loot", "pvpKills", "botKills", "playerDeaths", "stormDeaths")


def _cell(x: float, y: float) -> int:
    return min(GRID - 1, max(0, int(x * GRID / 1024))) + GRID * min(GRID - 1, max(0, int(y * GRID / 1024)))


def build_analytics(matches: list[dict[str, object]]) -> dict[str, object]:
    """Creates map keyed raw grids and cohort summaries without dataset-specific assumptions."""
    entities: dict[str, dict[str, Any]] = {}
    flows: dict[str, dict[str, Any]] = {}
    player_sessions: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for match in matches:
        map_id, date = str(match["mapId"]), str(match["date"])
        entity = entities.setdefault(map_id, {"grids": {key: [0] * (GRID * GRID) for key in ENTITY_KEYS}, "counters": defaultdict(int)})
        flow = flows.setdefault(map_id, {"cells": [{"id": index, "traffic": 0, "loot": 0, "pvpKills": 0, "botKills": 0, "playerDeaths": 0, "stormDeaths": 0} for index in range(GRID * GRID)]})
        for player in match.get("players", []):
            if not isinstance(player, dict):
                continue
            journey = player.get("journey", [])
            if not journey:
                continue
            first = journey[0]
            if not isinstance(first, list) or len(first) < 2:
                continue
            key = "bots" if bool(player.get("isBot")) else "humans"
            entity["grids"][key][_cell(float(first[0]), float(first[1]))] += 1
            entity["counters"][key] += 1
            if not bool(player.get("isBot")):
                player_sessions[str(player["id"])].append({"date": date, "mapId": map_id, "survivalTime": float(player.get("survivalTime", 0)), "eventCount": int(player.get("eventCount", 0))})
            for point in journey:
                if isinstance(point, list) and len(point) >= 2:
                    flow["cells"][_cell(float(point[0]), float(point[1]))]["traffic"] += 1
        for event in match.get("events", []):
            if not isinstance(event, dict):
                continue
            event_type = str(event.get("type", "")); x, y = float(event.get("x", 0)), float(event.get("y", 0)); index = _cell(x, y)
            key = {"Loot": "loot", "Kill": "pvpKills", "BotKill": "botKills", "Killed": "playerDeaths", "BotKilled": "playerDeaths", "KilledByStorm": "stormDeaths"}.get(event_type)
            if key is None:
                continue
            entity["grids"][key][index] += 1; entity["counters"][key] += 1; flow["cells"][index][key] += 1
    for payload in entities.values():
        counters = payload["counters"]
        counters["humanBotRatio"] = round(counters["humans"] / counters["bots"], 3) if counters["bots"] else None
        counters["pvpPveRatio"] = round(counters["pvpKills"] / counters["botKills"], 3) if counters["botKills"] else None
        payload["counters"] = dict(counters)
    for flow in flows.values():
        for cell in flow["cells"]:
            cell["botEncounters"] = cell["botKills"] + cell["playerDeaths"]
            cell["playerEncounters"] = cell["pvpKills"]
            cell["neighbours"] = [candidate for candidate in (cell["id"] - 1, cell["id"] + 1, cell["id"] - GRID, cell["id"] + GRID) if 0 <= candidate < GRID * GRID and (candidate // GRID == cell["id"] // GRID or abs(candidate - cell["id"]) == GRID)]
    cohort_players: list[dict[str, object]] = []
    daily: dict[str, dict[str, set[str]]] = defaultdict(lambda: {"new": set(), "returning": set(), "active": set()})
    for player_id, sessions in player_sessions.items():
        sessions.sort(key=lambda item: item["date"])
        count = len(sessions); cohort = "frequent" if count >= 5 else "returning" if count > 1 else "firstSession"
        for index, session in enumerate(sessions):
            daily[session["date"]]["active"].add(player_id)
            daily[session["date"]]["new" if index == 0 else "returning"].add(player_id)
        cohort_players.append({"id": player_id, "cohort": cohort, "matchCount": count, "firstDate": sessions[0]["date"], "lastDate": sessions[-1]["date"], "sessions": sessions})
    return {"entityDistribution": {"gridSize": GRID, "maps": entities}, "flowAnalysis": {"gridSize": GRID, "maps": flows}, "playerCohorts": {"players": cohort_players, "daily": [{"date": date, "active": len(value["active"]), "new": len(value["new"]), "returning": len(value["returning"])} for date, value in sorted(daily.items())]}}

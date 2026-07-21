"""Precomputed match statistics; browser code only displays these values."""
from __future__ import annotations

from collections import Counter
from typing import Iterable

from .models import PixelRecord
from .validator import is_bot


def build_statistics(records: Iterable[PixelRecord], players: list[dict[str, object]], duration: float) -> dict[str, object]:
    """Returns the summary contract required by the inspector panel."""
    rows = list(records)
    event_counts = Counter(row.raw.event for row in rows)
    humans = sum(not is_bot(str(player["id"])) for player in players)
    bots = len(players) - humans
    movement = [row for row in rows if row.raw.event in {"Position", "BotPosition"}]
    bins = Counter((min(7, int(row.pixel_x // 128)), min(7, int(row.pixel_y // 128))) for row in movement)
    busiest = max(bins, key=lambda bin_: (bins[bin_], -bin_[1], -bin_[0])) if bins else (0, 0)
    survival = [float(player["survivalTime"]) for player in players]
    return {
        "matchDuration": round(duration, 3), "totalPlayers": len(players), "humans": humans, "bots": bots,
        "kills": event_counts["Kill"] + event_counts["BotKill"],
        "deaths": event_counts["Killed"] + event_counts["BotKilled"],
        "stormDeaths": event_counts["KilledByStorm"], "lootEvents": event_counts["Loot"],
        "averageSurvival": round(sum(survival) / len(survival), 3) if survival else 0.0,
        "maximumSurvival": round(max(survival), 3) if survival else 0.0,
        "minimumSurvival": round(min(survival), 3) if survival else 0.0,
        "mostActiveArea": f"Grid {busiest[0] + 1},{busiest[1] + 1}",
    }

"""Analyse match timelines and movement cadence; writes docs/match-analysis.md."""
from collections import Counter, defaultdict
from datetime import datetime, timezone
import numpy as np
from _dataset import ROOT, iter_files, ms, markdown_table


def q(values, p):
    return float(np.percentile(values, p)) if values else float("nan")


def main():
    matches = defaultdict(lambda: {"maps": set(), "users": set(), "ticks": [], "events": 0})
    journeys = []
    duplicate_rows = 0
    for path, data in iter_files():
        user, match_id, map_id = data["user_id"][0], data["match_id"][0], data["map_id"][0]
        row_ticks = [ms(t) for t in data["ts"]]
        item = matches[match_id]; item["maps"].add(map_id); item["users"].add(user); item["ticks"].extend(row_ticks); item["events"] += len(row_ticks)
        movement = sorted((ms(data["ts"][i]), data["x"][i], data["z"][i]) for i, e in enumerate(data["event"]) if e in {"Position", "BotPosition"})
        journeys.append((path, user, match_id, movement))
    durations = {m: max(v["ticks"]) - min(v["ticks"]) for m, v in matches.items()}
    duration_values = list(durations.values())
    map_counts = Counter(next(iter(v["maps"])) for v in matches.values())
    # The stored millisecond timestamp is numerically a Unix *seconds* value.
    raw_ticks = [tick for v in matches.values() for tick in v["ticks"]]
    calendar_start = datetime.fromtimestamp(min(raw_ticks), timezone.utc)
    calendar_end = datetime.fromtimestamp(max(raw_ticks), timezone.utc)
    gaps, distances, speeds, movement_counts, break_gaps, zero_dt = [], [], [], [], 0, 0
    for _, _, _, movement in journeys:
        movement_counts.append(len(movement))
        for (t0, x0, z0), (t1, x1, z1) in zip(movement, movement[1:]):
            dt = t1 - t0
            dist = float(np.hypot(x1 - x0, z1 - z0))
            if dt < 0:
                continue
            if dt == 0:
                zero_dt += 1
                continue
            gaps.append(dt); distances.append(dist); speeds.append(dist / dt)
            if dt > 15:
                break_gaps += 1
    largest = max(durations, key=durations.get); smallest = min(durations, key=durations.get)
    text = "# Match and movement analysis\n\n"
    text += "## Match coverage\n\n"
    text += markdown_table(["Measure", "Verified value"], [
        ("Matches", f"{len(matches):,}"), ("Maps (by match)", "; ".join(f"{m}: {map_counts[m]:,}" for m in sorted(map_counts))),
        ("Duration, mean / median", f"{np.mean(duration_values):.1f} s / {np.median(duration_values):.1f} s"),
        ("Duration, min / max", f"{min(duration_values):.1f} s / {max(duration_values):.1f} s"),
        ("Smallest match", f"{smallest} ({durations[smallest]:.1f} s; {len(matches[smallest]['users'])} players; {matches[smallest]['events']} rows)"),
        ("Largest match", f"{largest} ({durations[largest]:.1f} s; {len(matches[largest]['users'])} players; {matches[largest]['events']} rows)"),
        ("Timeline ordering", "Non-decreasing within every movement journey after sorting; ties exist"),
    ])
    text += "\n\n## Timestamp finding (material data-quality issue)\n\n"
    text += f"Although Parquet declares `timestamp[ms]`, its numeric ticks span **{calendar_start:%Y-%m-%d %H:%M:%S} to {calendar_end:%Y-%m-%d %H:%M:%S} UTC** when interpreted as Unix *seconds*. This conflicts with the README/folder claim of Feb 10–14, 2026. Read literally as millisecond timestamps, they render in January 1970 and make a whole match last under a second. The internally consistent interpretation for match duration is that the numeric ticks are seconds, but neither its epoch nor the claimed date range can be confirmed from this extract. All duration/cadence values in this report use tick differences as **seconds**; confirm the source contract with telemetry owners before production use.\n\n"
    text += "## Movement sampling and continuity\n\n"
    text += markdown_table(["Measure", "Verified value"], [
        ("Movement rows", f"{sum(movement_counts):,}"), ("Movement updates per journey: mean / min / max", f"{np.mean(movement_counts):.2f} / {min(movement_counts)} / {max(movement_counts)}"),
        ("Inter-sample interval (seconds): p50 / p95 / max", f"{q(gaps,50):.3f} / {q(gaps,95):.3f} / {max(gaps):.3f}"),
        ("Step distance (world units): p50 / p95 / max", f"{q(distances,50):.2f} / {q(distances,95):.2f} / {max(distances):.2f}"),
        ("Derived horizontal speed: p50 / p95 / max", f"{q(speeds,50):.2f} / {q(speeds,95):.2f} / {max(speeds):.2f}"),
        ("Intervals over 15 seconds", f"{break_gaps:,} ({break_gaps / len(gaps):.2%} of positive intervals)"),
        ("Zero-duration movement pairs", f"{zero_dt:,}"),
    ])
    text += "\n\nPaths are ordered samples rather than an uninterrupted continuous trace. Renderers should split a line at long time gaps (recommend >15 s pending gameplay confirmation), zero-time samples, invalid points, and extreme implied speeds; never interpolate over such breaks.\n"
    (ROOT / "docs" / "match-analysis.md").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()

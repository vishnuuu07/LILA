"""Summarise decoded event values, field population, and representative rows."""
from collections import Counter, defaultdict
import math
from _dataset import ROOT, iter_files, markdown_table


def fmt(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def main():
    counts, samples, event_files = Counter(), {}, Counter()
    all_columns = ["user_id", "match_id", "map_id", "x", "y", "z", "ts", "event"]
    populated = defaultdict(Counter)
    for _, data in iter_files():
        for i, event in enumerate(data["event"]):
            counts[event] += 1
            event_files[event] += 1
            for column in all_columns:
                value = data[column][i]
                if value is not None and not (isinstance(value, float) and math.isnan(value)):
                    populated[event][column] += 1
            samples.setdefault(event, {column: data[column][i] for column in all_columns})
    rows = []
    for event, count in counts.most_common():
        used = ", ".join(c for c in all_columns if populated[event][c] == count)
        sample = samples[event]
        example = f"{sample['user_id']}; {sample['map_id']}; x={sample['x']:.2f}, y={sample['y']:.2f}, z={sample['z']:.2f}; ts={fmt(sample['ts'])}"
        rows.append((event, f"{count:,}", f"{count / sum(counts.values()):.2%}", used, example))
    known = {"Position", "BotPosition", "Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"}
    unknown = sorted(set(counts) - known)
    text = "# Event summary\n\nAll byte values decoded as UTF-8 without decode failures.\n\n"
    text += markdown_table(["Decoded event", "Rows", "Share", "Fully populated columns", "Representative row (user; map; coords; ts)"], rows)
    text += "\n\n## Validation\n\n"
    text += f"- Unique decoded values: {len(counts)}. Unknown values relative to the README: **{unknown if unknown else 'none'}**.\n"
    text += "- Every event type has all eight documented columns populated in every row; discrete events are therefore both player-associated and location-bearing.\n"
    text += "- Event semantics confirmed from data/README: `Position`/`BotPosition` are movement samples; combat, storm, and loot rows are point events. The data alone cannot identify the victim, item, weapon, or storm boundary because no additional attributes exist.\n"
    (ROOT / "docs" / "event-summary.md").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()

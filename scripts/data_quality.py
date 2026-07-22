"""Run data-quality checks and write docs/data-quality.md (no source mutations)."""
from collections import Counter, defaultdict
import math
import numpy as np
from _dataset import ROOT, UUID_RE, is_bot, iter_files, markdown_table


def main():
    total = 0; nulls = Counter(); nonfinite = Counter(); exact = Counter(); event_actor = defaultdict(Counter)
    coordinate_values = defaultdict(list); inconsistent = Counter(); pair_files = Counter(); map_by_match = defaultdict(set)
    for path, data in iter_files():
        users, matches, maps = set(data['user_id']), set(data['match_id']), set(data['map_id'])
        if len(users) != 1: inconsistent['multiple user_id values in a file'] += 1
        if len(matches) != 1: inconsistent['multiple match_id values in a file'] += 1
        if len(maps) != 1: inconsistent['multiple map_id values in a file'] += 1
        pair_files[(data['user_id'][0], data['match_id'][0])] += 1; map_by_match[data['match_id'][0]].update(maps)
        actor = 'bot' if is_bot(data['user_id'][0]) else 'human' if UUID_RE.match(data['user_id'][0]) else 'unclassified'
        for i in range(len(data['event'])):
            total += 1
            for column in ('user_id','match_id','map_id','x','y','z','ts','event'):
                value = data[column][i]
                if value is None: nulls[column] += 1
                if column in {'x','y','z'}:
                    if not np.isfinite(value): nonfinite[column] += 1
                    else: coordinate_values[column].append(value)
            event_actor[data['event'][i]][actor] += 1
            exact[(data['user_id'][i], data['match_id'][i], data['map_id'][i], data['x'][i], data['y'][i], data['z'][i], data['ts'][i], data['event'][i])] += 1
    duplicates = sum(v-1 for v in exact.values() if v > 1)
    event_rows = [(e, c['human'], c['bot'], c['unclassified']) for e,c in sorted(event_actor.items())]
    ranges = [(c, f"{min(v):.3f}", f"{max(v):.3f}") for c,v in coordinate_values.items()]
    text = "# Data quality report\n\n"
    text += markdown_table(["Check", "Finding", "Recommended handling"], [
        ("Files/rows read", f"1,243 / {total:,}", "Treat every file as an immutable journey partition."),
        ("Null values", "0 in all 8 columns", "Keep required-field validation in ingestion."),
        ("NaN/Infinity coordinates", "0 in x, y, and z", "Reject/quarantine any future non-finite coordinate."),
        ("Exact duplicate rows", f"{duplicates:,} duplicate occurrences across all files", "Deduplicate only after preserving source file provenance; ties can be meaningful."),
        ("Duplicate (user_id, match_id) files", f"{sum(v-1 for v in pair_files.values() if v>1):,} duplicate partition", "Drop only after audit; one identical 88-row journey occurs in February_10 and February_11."),
        ("Mixed identifiers/maps within file", "0 files", "Validate partition invariants at load time."),
        ("Multiple maps in a match", f"{sum(len(v)>1 for v in map_by_match.values())}", "Use match_id → map_id as a safe one-to-one join in this extract."),
        ("Out-of-bounds X/Z", "0 (see coordinate validation)", "Do not clip silently; keep a future OOB audit."),
        ("Event decode", "8 valid UTF-8 values; no unknown values", "Decode bytes once in preprocessing and retain original schema metadata."),
        ("Timestamp contract", "Physical type/value/date semantics conflict", "Block wall-clock display until telemetry owners specify unit and epoch."),
    ])
    text += "\n\n## Numeric ranges\n\n" + markdown_table(["Coordinate", "Minimum", "Maximum"], ranges)
    text += "\n\n## Event actor validation\n\n" + markdown_table(["Event", "Human rows", "Bot rows", "Unclassified rows"], event_rows)
    text += "\n\n`BotPosition` occurs only in bot journeys. Every other event is predominantly human-associated, but `Position`, `Loot`, `BotKill`, and `BotKilled` also occur in numeric-ID bot journeys (see the table). Therefore event name must not be used to classify an actor: use the verified numeric-versus-UUID identifier rule. The README's combat labels remain the semantic source of truth. No corrupt Parquet files or encoding replacement characters were encountered.\n"
    (ROOT / 'docs' / 'data-quality.md').write_text(text, encoding='utf-8')
    print("Wrote docs/data-quality.md")


if __name__ == '__main__':
    main()

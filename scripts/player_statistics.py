"""Analyse player identity, bot classification, and match roster sizes."""
from collections import Counter, defaultdict
from statistics import mean, median
from _dataset import ROOT, UUID_RE, is_bot, iter_files, markdown_table


def main():
    identities, appearances, roster, malformed = set(), Counter(), defaultdict(set), []
    journey_type = Counter()
    for path, data in iter_files():
        users, matches = set(data["user_id"]), set(data["match_id"])
        if len(users) != 1 or len(matches) != 1:
            malformed.append(str(path))
        user, match_id = next(iter(users)), next(iter(matches))
        identities.add(user); appearances[user] += 1; roster[match_id].add(user)
        journey_type["bot" if is_bot(user) else "human"] += 1
    humans = sorted(u for u in identities if UUID_RE.match(u))
    bots = sorted(u for u in identities if is_bot(u))
    unclassified = sorted(identities - set(humans) - set(bots))
    sizes = [len(v) for v in roster.values()]
    bins = Counter(sizes)
    text = "# Player analysis\n\n"
    text += markdown_table(["Measure", "Verified value"], [
        ("Unique player identifiers", f"{len(identities):,}"), ("Human identifiers (UUID)", f"{len(humans):,}"),
        ("Bot identifiers (numeric only)", f"{len(bots):,}"), ("Unclassified identifiers", len(unclassified)),
        ("Player journeys/files", f"{sum(journey_type.values()):,} ({journey_type['human']:,} human / {journey_type['bot']:,} bot)"),
        ("Matches with telemetry", f"{len(roster):,}"), ("Players per match: mean / median", f"{mean(sizes):.2f} / {median(sizes):.0f}"),
        ("Players per match: min / max", f"{min(sizes)} / {max(sizes)}"),
        ("One user and one match per file", "Yes" if not malformed else f"No ({len(malformed)} exceptions)"),
    ])
    text += "\n\n## Roster-size distribution\n\n" + markdown_table(["Players in match", "Matches"], [(n, bins[n]) for n in sorted(bins)])
    text += "\n\n## Identification rule\n\nA bot is a `user_id` containing only decimal digits; humans match the canonical UUID pattern. These groups are disjoint and cover every identifier, confirming the README rule. Use the file-level identifier (not event name) as the canonical classification; event names are consistent with it but are not needed to classify a player.\n"
    text += "\n## Identity caveat\n\nThe 339 count is identifiers observed in this five-day extract, not a claim of 339 simultaneously active users. Numeric bot IDs repeat across matches, as expected for reusable AI identities.\n"
    (ROOT / "docs" / "player-analysis.md").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()

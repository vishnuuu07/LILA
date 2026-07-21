"""ATLAS Phase 2 static telemetry preprocessing entry point.

Run from the repository root: `python scripts/preprocess.py`.
"""
from __future__ import annotations

from pathlib import Path

from pipeline.coordinate_mapper import MAPS, map_records, validate_transform_configuration
from pipeline.loader import discover_parquet_files, read_records
from pipeline.match_builder import build_match, group_by_match
from pipeline.models import PipelineReport
from pipeline.validator import validate_records
from pipeline.writer import output_directories, verify_match_contract, write_json, write_match_outputs

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "player_data"


def main() -> None:
    """Executes all deterministic stages and writes frontend-ready static JSON."""
    report = PipelineReport()
    print("Validating coordinate transform...")
    validate_transform_configuration()
    print("Reading Parquet telemetry...")
    raw = list(read_records(discover_parquet_files(DATA_ROOT), report))
    print(f"Validating {len(raw):,} decoded rows...")
    validated = validate_records(raw, report, set(MAPS))
    print("Converting world coordinates to minimap pixels...")
    pixels = map_records(validated, report)
    print("Building matches, summaries, and heatmaps...")
    output = output_directories(ROOT)
    matches: list[dict[str, object]] = []
    metadata_matches: list[dict[str, object]] = []
    for match_id, rows in sorted(group_by_match(pixels).items()):
        try:
            match, summary, heatmaps = build_match(match_id, rows)
        except Exception as error:
            report.warn(f"Skipped invalid match {match_id}: {error}")
            continue
        write_match_outputs(output, match_id, match, summary, heatmaps)
        matches.append(match)
        metadata_matches.append({"id": match_id, "mapId": match["mapId"], "date": match["date"], "file": f"/data/matches/{match_id}.json", "summaryFile": f"/data/summaries/{match_id}.json"})
    print("Verifying generated JSON against the frontend contract...")
    match_count, player_count, event_count = verify_match_contract(matches)
    maps = [{"id": map_id, "name": str(config["name"]), "image": str(config["image"]), "logicalSize": 1024} for map_id, config in sorted(MAPS.items())]
    write_json(output["data"] / "maps.json", {"maps": maps})
    write_json(output["data"] / "metadata.json", {
        "maps": [item["id"] for item in maps],
        "dates": sorted({str(item["date"]) for item in metadata_matches}),
        "matches": metadata_matches,
        "playerCount": player_count,
        "eventCount": event_count,
        "availableFilters": {"heatmaps": ["traffic", "kills", "deaths", "loot"], "events": ["Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"]},
        "warnings": report.warnings,
    })
    print(f"Completed successfully: {match_count:,} matches, {player_count:,} players, {event_count:,} events.")
    if report.warnings:
        print(f"Warnings: {len(report.warnings):,} (including {report.duplicate_partitions:,} duplicate partitions skipped).")


if __name__ == "__main__":
    main()

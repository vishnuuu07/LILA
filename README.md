# ATLAS - Player Journey Explorer

ATLAS is a static React and Canvas tool for reviewing preprocessed LILA player journeys. The browser only reads compact JSON with already-mapped minimap pixels; it never opens Parquet files or performs world-coordinate conversion.

## Regenerate telemetry data

Install the Python dependencies used for discovery (`pyarrow` and `numpy`), then run:

```powershell
python scripts/preprocess.py
```

The command discovers `player_data/February_*/*.nakama-0`, validates rows and map conversion, and writes deterministic files under `public/data/`:

- `metadata.json` and `maps.json`
- one match and one summary JSON document per match
- precomputed traffic, kill, death, and loot heatmap grids

The pipeline skips corrupt source partitions with warnings, validates the generated runtime contract, and emits no world coordinates in frontend payloads. Timestamp values are emitted as relative telemetry ticks because the source timestamp's absolute epoch is documented as unresolved in [docs/match-analysis.md](docs/match-analysis.md).

## Run the app

```powershell
npm install
npm run dev
```

For release validation, run `npm run typecheck` followed by `npm run build`.

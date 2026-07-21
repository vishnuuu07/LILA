# Submission Checklist

## Original assignment requirements

| Requirement | Status | Evidence |
| --- | --- | --- |
| Parse supplied Parquet | Completed | `scripts/pipeline/loader.py` |
| Correct minimap coordinates | Completed | `scripts/pipeline/coordinate_mapper.py`, [coordinate validation](coordinate-validation.md) |
| Human/bot distinction | Completed | `validator.is_bot`, Canvas path styling |
| Kill, death, loot, storm markers | Completed | `EventLayer.ts`, semantic legend |
| Map/date/match filtering | Completed | `FilterRail.tsx`, `App.tsx` |
| Playback and timeline | Completed | `PlaybackBar.tsx`, RAF loop in `App.tsx` |
| Traffic / kill / death heatmaps | Completed | `HeatmapLayer.ts`, generated grids |
| Architecture documentation | Completed | [../ARCHITECTURE.md](../ARCHITECTURE.md) |
| Three data-backed insights | Completed | [../INSIGHTS.md](../INSIGHTS.md) |
| Shareable deployment | **Action required** | Add verified production URL to `README.md` before submission |

## Stretch work delivered

- Area inspection lens with player/event/dwell metrics
- Grid-highlighted deterministic quick insights
- Multi-player journey comparison and map-side stats dock
- Resizable side rails with pointer and keyboard controls
- Temporal/cached heatmaps and semantic density scale
- Drag-safe map and area-lens interactions
- Match outcome language that avoids unsupported winner claims

## Before sending the repository link

- [ ] Run `python scripts/preprocess.py` from a clean checkout.
- [ ] Run `npm ci`, `npm run typecheck`, and `npm run build`.
- [ ] Deploy and add the public URL to the README.
- [ ] Open the deployed URL in a clean browser profile and verify data/minimap assets.
- [ ] Ensure supplied telemetry and minimap assets are permitted in the public repository.
- [ ] Review [FINAL_QA.md](FINAL_QA.md) and capture any final deployment-specific evidence.

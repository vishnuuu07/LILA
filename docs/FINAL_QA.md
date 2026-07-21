# Final QA Record

## Automated checks

| Check | Result |
| --- | --- |
| Coordinate inverse/bounds gate | Passed for all three maps; zero missing/non-finite/out-of-bounds coordinate rows |
| Generated frontend contract | Passed during preprocessing |
| TypeScript | `npm run typecheck` passed during the final interaction/layout passes |
| Production build | `npm run build` passed during the final interaction/layout passes |

## Manual browser checks completed

- Loaded generated metadata and selected real match data.
- Verified a 16-player Ambrose Valley match (`fbbc5d02…`) exposes 15 bots and one human; this confirmed source partitions are grouped by match rather than shown one-file-at-a-time.
- Selected three comparison routes simultaneously; confirmed stable distinct route treatments and map-side comparison information.
- Verified traffic heatmap and quick-insight grid control paths.
- Verified empty-area inspector state and Escape clearing.
- Verified 4× playback advanced approximately 6.4 game seconds over about 1.2 seconds plus browser command overhead; the prior per-frame RAF recreation was removed.
- Verified desktop layout at 2048×1024 (`1598×926` canvas) and 1366×768 (`916×670` canvas), with no browser console errors reported.

## Deployment QA still required

The repository build has been validated locally, but a production URL was not supplied in this workspace. Before submission, test the deployed host for static JSON MIME/paths, minimap assets, first-load time, all filters, playback speeds, resize handles, pan/zoom, and mobile fallback.

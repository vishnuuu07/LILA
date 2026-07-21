# Interview Notes

## Why preprocess instead of parse Parquet in the browser?

Parquet parsing, byte decoding, match reconstruction, coordinate conversion, and validation are data-engineering concerns. Doing them once produces small deterministic JSON, makes a static deployment possible, and prevents two coordinate implementations from drifting.

## Why Canvas rather than SVG?

Playback changes visible segments and markers continuously. Canvas avoids retaining a large DOM/SVG node set and fits the renderer’s immediate-mode layer model. React manages controls and intent; Canvas performs draw work.

## How is coordinate mapping kept trustworthy?

Only X/Z are mapped. Per-map scale and origin are centralized in the Python mapper; Z is flipped for image space. A fail-closed inverse and bounds validation gate runs before JSON is written, and the browser receives only 1024-space pixels.

## How does playback stay smooth?

One requestAnimationFrame loop accumulates `performance.now()` deltas in a ref, then applies the selected multiplier. The renderer coalesces redraw requests to one frame. Paths/events stop at the current relative match time.

## How are heatmaps generated?

The pipeline writes static grid data for full matches. A small runtime cache derives temporal traffic/credited-elimination/elimination-suffered grids by match/type/time bucket so timeline changes do not repeatedly rebuild the same grid.

## Why do credited eliminations and eliminations suffered differ?

They are independent captured event streams. The schema lacks a killer/victim relation, partitions can be incomplete, event locations/times can differ, and the latter category includes storm eliminations. The UI uses that language instead of ambiguous raw labels.

## Can ATLAS identify the winner?

Not authoritatively. There is no winner/extraction/outcome field. ATLAS can only present a clearly qualified last-survivor candidate when a multi-player capture has exactly one player with no recorded elimination.

## What would you improve with more time?

Add a precomputed recurring-player aggregate for a leaderboard, pipeline tests/CI, deployed performance telemetry, and richer combat relationships from authoritative telemetry. I would not infer these relationships from the current schema.

## Strong concise walkthrough

“I started by validating the data contract, especially the world-to-minimap transform and the fact that each file is one player partition. I converted that into static match JSON, then built a React-controlled Canvas renderer so interaction state is separate from per-frame drawing. Finally I added level-design workflows—area inspection, density, comparisons, and clear telemetry language—while keeping claims bounded by what the data proves.”

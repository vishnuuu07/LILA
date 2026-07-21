# Performance Review

## Design measures

- The browser fetches the lightweight index first and only the selected match JSON afterwards.
- Coordinates, summaries, and base heatmaps are precomputed; no Parquet work runs in the client.
- Canvas rendering is layered and scheduled at most once per animation frame.
- Playback uses a single RAF loop and a ref-backed clock rather than recreating the loop on every timestamp update.
- Temporal grids are cached by match, mode, and coarse time bucket.
- Layer toggles replace renderer state without reloading the match/camera.
- The map stage owns canvas sizing through `ResizeObserver`, preventing an interim inline canvas size from wasting wide-screen workspace.

## Evidence and limits

Build/type checks and interactive browser validation passed; resize and 4× playback were checked manually. No repeatable profiler trace, Lighthouse run, memory profile, or deployed network budget is stored in this repository, so claims such as “60 FPS on every device” should not be made in an interview. The defensible statement is that the architecture avoids known per-frame allocations and repeated data loads, and that it was manually exercised on the provided dataset.

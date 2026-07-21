# Engineering Decisions

| Problem | Options considered | Decision | Reasoning and trade-off |
| --- | --- | --- | --- |
| Parquet in a static browser app | Parse Parquet client-side; serve a backend; preprocess | Preprocess into static JSON | Removes a large browser dependency and centralizes validation. Data refresh requires a preprocessing run. |
| Map coordinates | Convert in React; convert once in pipeline | Pipeline conversion into 1024-space pixels | One source of truth avoids flipped-axis drift. The client cannot display raw-world debugging coordinates. |
| Match payloads | One large file; one file per source partition; one file per match | One JSON per match plus index | Fetches stay bounded and match replay is self-contained. Static hosts carry many small files. |
| Rendering | DOM/SVG; WebGL; Canvas 2D | Layered Canvas 2D | Appropriate for frequently redrawn paths/markers with limited engineering surface area. Canvas needs explicit hit testing and accessibility labels. |
| Heatmaps | Reaggregate every frame; precompute grids | Precompute grids with cached temporal variants | Predictable playback cost. Grid resolution trades detail for fast rendering. |
| Product state | Canvas owns all state; React owns all state | React owns intent; renderer owns draw state | UI remains inspectable while hot rendering avoids React per-frame work. Integration needs disciplined API updates. |
| Combat wording | Mirror raw names | Semantic UI names | `BotKill` labels are ambiguous in observed data. “Credited” and “suffered” state exactly what the record supports. |
| Winner display | Infer a winner for every match; omit entirely | Cautious last-survivor candidate | A true winner field is absent. Candidate wording is only shown when exactly one captured player survives in a multi-player document. |
| Future leaderboard | Fetch every match at runtime; backend; aggregate JSON | Planned precomputed aggregate JSON | Scales on static hosting. It is documented, not currently released, because the aggregate pipeline output is not yet present. |

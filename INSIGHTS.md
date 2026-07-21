# Three Evidence-Backed Game Insights

These observations describe the supplied capture, not universal gameplay behaviour. Timestamp units are treated as relative match time.

## 1. Ambrose Valley dominates captured match coverage

**Evidence.** 566 of 796 reconstructed matches are AmbroseValley (about 71%); Lockdown has 171 and GrandRift 59.

**Designer interpretation.** Any cross-map comparison should show sample size prominently. Apparent heatmap strength on Ambrose Valley may reflect both population and layout, not necessarily a more compelling route design.

**Action.** Normalize map-level movement/combat density by match count before using it to prioritize level changes. Track normalized traffic per grid cell and per captured player.

## 2. Movement data is sampled, not continuous navigation

**Evidence.** The median movement interval is 5 seconds; the 95th percentile is 10 seconds; 1,537 intervals exceed 15 seconds. The maximum observed gap is 518 seconds.

**Designer interpretation.** A straight line between samples can cross walls, buildings, or unobserved encounters. Treat paths and density as movement evidence, not replay-accurate locomotion.

**Action.** Keep path breaks over long gaps and use area/heatmap aggregation to identify repeated corridors. A follow-up telemetry change should record higher-frequency motion or navigation state around encounters.

## 3. Combat and death density are related but not interchangeable

**Evidence.** The source contains independent credited-elimination (`Kill`/`BotKill`) and elimination-suffered (`Killed`/`BotKilled`/storm) streams. The schema has no attacker-victim relation; 39 storm eliminations are a separate environmental outcome.

**Designer interpretation.** A credited-elimination hotspot highlights where combat is awarded, while an elimination-suffered hotspot also includes storm pressure and incomplete partition coverage. They should not be presented as the same map.

**Action.** Compare the two overlays with traffic and area inspection before changing cover, loot, or storm routing. Track the ratio of eliminations suffered to traffic by grid cell as a future balance metric.

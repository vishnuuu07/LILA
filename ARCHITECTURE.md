# ARCHITECTURE

## Overview

ATLAS is a static web application built to visualize player journeys from raw gameplay telemetry. The project separates **offline data processing** from **interactive visualization**, allowing the browser to focus entirely on rendering while all expensive computation happens once during preprocessing.

---

## Technology Choices

| Technology | Why |
|------------|-----|
| React + TypeScript | Predictable state management and type safety for a medium-sized interactive application. |
| HTML5 Canvas | Efficient rendering of hundreds of movement points, paths, and overlays compared to SVG for this use case. |
| Python (Pandas + PyArrow) | Native support for Parquet and efficient batch processing of telemetry data. |
| Vite | Fast development experience and lightweight production build. |
| Tailwind CSS | Rapid development with a consistent design system. |

---

## Data Flow

```text
Parquet Files
      │
      ▼
Python Preprocessing
  • Validate schema
  • Decode telemetry
  • Map world coordinates → minimap pixels
  • Group players by match
  • Generate statistics
      │
      ▼
Optimized JSON
      │
      ▼
React Application
      │
      ▼
Canvas Renderer
```

The browser never reads Parquet files or performs coordinate conversion. It simply loads preprocessed JSON and renders the visualization.

---

## Coordinate Mapping

This was the most critical part of the project.

The telemetry stores player locations as **game world coordinates**, while the UI renders them on a **2D minimap image**. These coordinate systems are different, so every player position must be transformed before rendering.

The preprocessing pipeline uses the map metadata provided in the assignment README:

1. Read the world origin and map dimensions.
2. Normalize each world coordinate relative to the playable area.
3. Scale the normalized values to the minimap image dimensions.
4. Invert the Y-axis where required because image coordinates increase downward while game coordinates use a different origin.
5. Validate the transformation by plotting sample player paths on each minimap and visually confirming that roads, buildings, and movement patterns aligned correctly.

This conversion is performed **once during preprocessing**, so the frontend only works with pixel coordinates.

---

## Assumptions

| Situation | Handling |
|----------|----------|
| One Parquet file represents one player in one match | Followed the dataset README. |
| Bots are identified using numeric IDs while humans use UUIDs | Used this consistently throughout preprocessing. |
| Coordinate mapping metadata in the README is authoritative | Validated visually against sample player paths before using it. |
| Static dataset | Chose offline preprocessing instead of runtime computation. |

---

## Major Trade-offs

| Considered | Decision | Reason |
|------------|----------|--------|
| Parse Parquet in browser | ❌ No | Larger bundle, slower startup, unnecessary repeated work. |
| SVG rendering | ❌ No | Canvas scales better for rendering many paths and event markers. |
| Runtime coordinate conversion | ❌ No | Conversion is deterministic and better performed once offline. |
| Static JSON output | ✅ Yes | Simpler deployment, faster loading, easier rendering pipeline. |
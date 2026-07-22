# ATLAS — Player Journey Explorer

ATLAS is an interactive gameplay analytics tool built for **Level Designers** to explore player behaviour in **LILA BLACK**. It transforms raw gameplay telemetry into an intuitive visual workspace where designers can replay matches, inspect player movement, analyze combat hotspots, investigate loot distribution, and discover spatial patterns that would otherwise be hidden inside raw telemetry.

Built for the **LILA Games Product Engineer Written Test**, the goal of this project is to bridge the gap between production telemetry and actionable level design insights through an interactive browser-based visualization tool.

---

# Key Features
## 🎮 Interactive Match Playback

Replay an entire match using timeline controls with play, pause, seek, restart, and playback speeds ranging from **0.5× to 4×**. The visualization updates in real time as player journeys and events unfold across the minimap.

---

## 🗺️ Accurate Player Journey Visualization

Every player's movement is reconstructed from telemetry and rendered on the correct minimap after converting world-space coordinates into minimap pixel coordinates during preprocessing.

- Human players and bots are visually distinguished
- Routes animate progressively during playback
- Multiple player journeys can be displayed simultaneously

---

## 📍 Event Visualization

Gameplay events are rendered directly on the map using dedicated markers.

Supported events include:

- Loot pickups
- Player eliminations
- Eliminations suffered
- Storm eliminations

Selecting or hovering over an event immediately displays its metadata and timeline position.

---

## 🔥 Interactive Heatmaps

Visualize spatial activity using multiple heatmap overlays.

Available overlays include:

- Player movement
- Elimination hotspots
- Death hotspots

Heatmaps update instantly and can also follow playback progression to visualize how activity evolves throughout a match.

---

## 🔎 Area Inspector

Click anywhere on the minimap to create an inspection region.

The Area Inspector summarizes activity inside the selected area, including:

- Player traffic
- Human vs Bot presence
- Loot events
- Eliminations
- Storm deaths
- Peak activity periods

This allows designers to quickly investigate any part of the level without manually inspecting every player route.

---

## 👥 Player Focus & Journey Comparison

Highlight individual players or compare multiple captured player journeys to better understand different navigation strategies.

Comparison includes:

- Route visualization
- Survival duration
- Combat participation
- Loot interactions
- Match outcome summary

---

## 📊 Quick Insights

ATLAS automatically highlights meaningful gameplay patterns extracted from telemetry.

Examples include:

- Highest traffic regions
- Combat hotspots
- Loot-rich locations
- Most active areas
- Early activity clusters

These insights help Level Designers quickly identify balancing opportunities without manually searching through every match.

---

## 🎛️ Analyst Workspace

The application provides a purpose-built workspace designed specifically for gameplay investigation.

Features include:

- Map filtering
- Date filtering
- Match filtering
- Layer visibility controls
- Timeline playback
- Match summary
- Event details
- Player focus panel
- Quick Insights panel
- Responsive resizable sidebars

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| React 19 | Application UI |
| TypeScript | Type-safe development |
| Vite | Development & production build |
| HTML5 Canvas | High-performance rendering |
| Python + PyArrow | Telemetry preprocessing |
| Tailwind CSS | Consistent design system |

---


# Running the Project

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

---

# Regenerating the Dataset

Run the preprocessing pipeline to regenerate all runtime data.

```bash
python scripts/preprocess.py
```

The pipeline automatically:

- Discovers all telemetry partitions
- Validates source data
- Maps world coordinates to minimap pixels
- Groups players into matches
- Generates match summaries
- Builds heatmap datasets
- Produces optimized JSON for the frontend

---

# Current Dataset

Generated from the supplied LILA BLACK telemetry.

- **1,243** Parquet player partitions
- **89,104** telemetry records
- **796** reconstructed matches
- **3** playable maps
- **1,242** processed player journeys
- **16,020** gameplay events
- **796** match JSON files
- **3,184** heatmap datasets

---

# Deployment

The application is designed as a fully static website.

Deployment steps:

1. Run the preprocessing pipeline.
2. Commit the generated `public/data/` directory.
3. Deploy using Vercel (or any static hosting provider).
4. Verify metadata loading, playback, filtering, and heatmaps.

**Live Demo**

> https://atlas-player-journey.vercel.app/

---

# Known Limitations

- Source telemetry does not provide an authoritative match winner.
- Killer/victim relationships are only available where supported by telemetry.
- Weapon information and inventory data are not included in the dataset.
- Most reconstructed matches contain only captured player partitions supplied in the dataset.
- Heatmaps are generated from the provided telemetry and do not represent the complete player population beyond the captured data.

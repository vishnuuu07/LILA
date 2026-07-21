import type { HeatmapGrid, SelectionArea } from "../renderer/MapRenderer";
import type { HeatmapKind, ParsedAtlasMatch, PlayerDetail } from "../types/atlas";

const MAP_SIZE = 1024;
const GRID_SIZE = 32;
const TIME_BUCKETS = 12;
const heatmapCache = new WeakMap<ParsedAtlasMatch, Map<string, HeatmapGrid>>();

export interface ComputedAreaInsight {
  playersPassed: number;
  humans: number;
  bots: number;
  kills: number;
  deaths: number;
  loot: number;
  stormDeaths: number;
  firstActivity: number | null;
  lastActivity: number | null;
  peakActivity: number | null;
  averageDwell: number;
}

export interface QuickInsight {
  id: string;
  label: string;
  value: string;
  evidence: string;
  tone: "cyan" | "red" | "gold" | "amber" | "purple";
}

function eventCategory(type: string): "kill" | "death" | "loot" | "storm" | "other" {
  const normalized = type.trim().toLowerCase();
  if (normalized.includes("storm")) return "storm";
  if (normalized.includes("loot")) return "loot";
  if (normalized === "killed" || normalized.endsWith("killed")) return "death";
  if (normalized === "kill" || normalized.endsWith("kill")) return "kill";
  return "other";
}

/** Returns a cached cumulative heatmap for the current coarse timeline bucket. */
export function temporalHeatmap(match: ParsedAtlasMatch, kind: HeatmapKind, time: number): HeatmapGrid | undefined {
  if (kind === "none") return undefined;
  const bucket = Math.min(TIME_BUCKETS - 1, Math.max(0, Math.floor((Math.max(0, time) / Math.max(match.duration, 1)) * TIME_BUCKETS)));
  const key = `${kind}:${bucket}`;
  const cache = heatmapCache.get(match) ?? new Map<string, HeatmapGrid>();
  heatmapCache.set(match, cache);
  const existing = cache.get(key);
  if (existing) return existing;
  const end = ((bucket + 1) / TIME_BUCKETS) * match.duration;
  const counts = new Array<number>(GRID_SIZE * GRID_SIZE).fill(0);
  const add = (x: number, y: number): void => {
    const column = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((x / MAP_SIZE) * GRID_SIZE)));
    const row = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((y / MAP_SIZE) * GRID_SIZE)));
    counts[row * GRID_SIZE + column] += 1;
  };
  if (kind === "traffic") {
    for (const player of match.players) for (const point of player.journey) if (point.t <= end) add(point.x, point.y);
  } else {
    const wanted = kind === "kills" ? "kill" : "death";
    for (const event of match.events) {
      const category = eventCategory(event.type);
      if (event.t <= end && (category === wanted || wanted === "death" && category === "storm")) add(event.x, event.y);
    }
  }
  const maximum = Math.max(...counts, 0);
  const grid = { columns: GRID_SIZE, rows: GRID_SIZE, values: counts.map((count) => maximum > 0 ? count / maximum : 0) };
  cache.set(key, grid);
  return grid;
}

/** Builds an evidence-only area readout from the normalized, in-memory match contract. */
export function inspectArea(match: ParsedAtlasMatch, area: SelectionArea): ComputedAreaInsight {
  const within = (x: number, y: number) => Math.hypot(x - area.x, y - area.y) <= area.radius;
  const passing = new Set<string>();
  const activity: number[] = [];
  let humans = 0;
  let bots = 0;
  let totalDwell = 0;
  for (const player of match.players) {
    let passed = false;
    let playerDwell = 0;
    for (let index = 0; index < player.journey.length; index += 1) {
      const point = player.journey[index];
      if (!within(point.x, point.y)) continue;
      passed = true;
      activity.push(point.t);
      const next = player.journey[index + 1];
      if (next) playerDwell += Math.max(0, next.t - point.t);
    }
    if (passed) {
      passing.add(player.id);
      if (player.isBot) bots += 1;
      else humans += 1;
      totalDwell += playerDwell;
    }
  }
  let kills = 0;
  let deaths = 0;
  let loot = 0;
  let stormDeaths = 0;
  for (const event of match.events) {
    if (!within(event.x, event.y)) continue;
    activity.push(event.t);
    const category = eventCategory(event.type);
    if (category === "storm") { stormDeaths += 1; deaths += 1; }
    else if (category === "loot") loot += 1;
    else if (category === "kill") kills += 1;
    else if (category === "death") deaths += 1;
  }
  const buckets = new Map<number, number>();
  for (const timestamp of activity) buckets.set(Math.floor(timestamp / 30), (buckets.get(Math.floor(timestamp / 30)) ?? 0) + 1);
  const peakBucket = [...buckets.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null;
  return { playersPassed: passing.size, humans, bots, kills, deaths, loot, stormDeaths, firstActivity: activity.length ? Math.min(...activity) : null, lastActivity: activity.length ? Math.max(...activity) : null, peakActivity: peakBucket === null ? null : peakBucket * 30, averageDwell: passing.size ? totalDwell / passing.size : 0 };
}

function gridLabel(x: number, y: number, divisions = 8): string {
  const column = Math.min(divisions - 1, Math.max(0, Math.floor((x / MAP_SIZE) * divisions))) + 1;
  const row = Math.min(divisions - 1, Math.max(0, Math.floor((y / MAP_SIZE) * divisions))) + 1;
  return `Grid ${column},${row}`;
}

function strongestCluster(points: readonly { x: number; y: number }[]): { label: string; count: number } | null {
  if (!points.length) return null;
  const buckets = new Map<string, number>();
  for (const point of points) {
    const label = gridLabel(point.x, point.y);
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }
  const entry = [...buckets.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return entry ? { label: entry[0], count: entry[1] } : null;
}

/** Produces only statements that have visible data evidence in the selected match. */
export function quickInsights(match: ParsedAtlasMatch): readonly QuickInsight[] {
  const insights: QuickInsight[] = [];
  const activeArea = typeof match.statistics.mostActiveArea === "string" ? match.statistics.mostActiveArea : null;
  if (activeArea) insights.push({ id: "traffic", label: "Highest traffic", value: activeArea, evidence: "Match summary: most active area", tone: "cyan" });
  const combat = strongestCluster(match.events.filter((event) => {
    const category = eventCategory(event.type);
    return category === "kill" || category === "death" || category === "storm";
  }));
  if (combat) insights.push({ id: "combat", label: "Combat cluster", value: combat.label, evidence: `${combat.count} kill/death event${combat.count === 1 ? "" : "s"} in this grid`, tone: "red" });
  const loot = strongestCluster(match.events.filter((event) => eventCategory(event.type) === "loot"));
  if (loot) insights.push({ id: "loot", label: "Loot hotspot", value: loot.label, evidence: `${loot.count} loot event${loot.count === 1 ? "" : "s"} in this grid`, tone: "gold" });
  const botPoints = match.players.filter((player) => player.isBot).flatMap((player) => player.journey);
  const bots = strongestCluster(botPoints);
  if (bots) insights.push({ id: "bots", label: "Bot concentration", value: bots.label, evidence: `${bots.count} sampled bot position${bots.count === 1 ? "" : "s"}`, tone: "amber" });
  const earlyLimit = Math.min(match.duration, 300);
  const early = match.events.filter((event) => event.t <= earlyLimit).length;
  if (early > 0) insights.push({ id: "early", label: earlyLimit === 300 ? "First five minutes" : "Early activity", value: `${early} events`, evidence: `Observed in the first ${Math.round(earlyLimit)} seconds`, tone: "purple" });
  return insights;
}

export function playerEventCounts(player: PlayerDetail, match: ParsedAtlasMatch): { engagement: number; loot: number; outcome: string } {
  const events = match.events.filter((event) => event.playerId === player.id);
  const engagement = events.filter((event) => ["kill", "death", "storm"].includes(eventCategory(event.type))).length;
  const loot = events.filter((event) => eventCategory(event.type) === "loot").length;
  const storm = events.some((event) => eventCategory(event.type) === "storm");
  const death = events.some((event) => eventCategory(event.type) === "death");
  return { engagement, loot, outcome: storm ? "Storm death" : death ? "Death recorded" : "Survived telemetry" };
}

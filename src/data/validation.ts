import type { HeatmapGrid, RendererEvent } from "../renderer/MapRenderer";
import type { AreaInsight, AtlasMap, AtlasMetadata, MatchIndexItem, MatchStatistics, ParsedAtlasMatch, PlayerDetail } from "../types/atlas";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function requireRecord(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function readText(record: JsonRecord, keys: readonly string[], label: string): string {
  const value = keys.map((key) => record[key]).find(isString);
  if (value === undefined) throw new Error(`${label} is missing.`);
  return value;
}

function finite(record: JsonRecord, keys: readonly string[], label: string): number {
  const value = keys.map((key) => record[key]).find(isFiniteNumber);
  if (value === undefined) throw new Error(`${label} must be a finite number.`);
  return value;
}

function optionalPrimitiveRecord(value: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" || entry === null) result[key] = entry;
  }
  return result;
}

function statistics(value: unknown): MatchStatistics {
  const record = requireRecord(value, "statistics");
  return optionalPrimitiveRecord(record) ?? {};
}

function points(value: unknown): readonly { x: number; y: number; t: number }[] {
  if (!Array.isArray(value)) throw new Error("Player journey must be an array.");
  return value.map((point, index) => {
    if (Array.isArray(point) && point.length >= 3 && isFiniteNumber(point[0]) && isFiniteNumber(point[1]) && isFiniteNumber(point[2])) {
      return { x: point[0], y: point[1], t: point[2] };
    }
    const record = requireRecord(point, `Player journey point ${index}`);
    return { x: finite(record, ["x", "px"], "journey x"), y: finite(record, ["y", "py"], "journey y"), t: finite(record, ["t", "time", "relativeSeconds"], "journey time") };
  });
}

function parsePlayer(value: unknown, index: number): PlayerDetail {
  const record = requireRecord(value, `player ${index}`);
  const actor = record.actorType === "bot" || record.isBot === true ? "bot" : "human";
  const flatJourney = Array.isArray(record.journey) ? points(record.journey) : [];
  const segments = Array.isArray(record.segments) ? record.segments.flatMap((segment) => points(segment)) : [];
  const journey = flatJourney.length > 0 ? flatJourney : segments;
  if (journey.length === 0) throw new Error(`player ${index} has no journey points.`);
  return {
    id: readText(record, ["id", "playerId", "userId"], "player id"),
    isBot: actor === "bot",
    actorType: actor,
    journey,
    displayName: typeof record.displayName === "string" ? record.displayName : undefined,
    spawnTime: isFiniteNumber(record.spawnTime) ? record.spawnTime : isFiniteNumber(record.startTime) ? record.startTime : undefined,
    deathTime: isFiniteNumber(record.deathTime) ? record.deathTime : isFiniteNumber(record.endTime) ? record.endTime : undefined,
    survivalTime: isFiniteNumber(record.survivalTime) ? record.survivalTime : undefined,
    eventCount: isFiniteNumber(record.eventCount) ? record.eventCount : undefined,
    pathLength: isFiniteNumber(record.pathLength) ? record.pathLength : undefined,
    metadata: optionalPrimitiveRecord(record.metadata),
  };
}

function parseEvent(value: unknown, index: number): RendererEvent & { details?: Record<string, string | number | boolean | null> } {
  const record = requireRecord(value, `event ${index}`);
  return { id: typeof record.id === "string" ? record.id : `event-${index}`, type: readText(record, ["type", "event"], "event type"), playerId: typeof record.playerId === "string" ? record.playerId : typeof record.userId === "string" ? record.userId : "unknown", x: finite(record, ["x", "px"], "event x"), y: finite(record, ["y", "py"], "event y"), t: finite(record, ["t", "time", "relativeSeconds"], "event time"), details: optionalPrimitiveRecord(record.details) };
}

function parseGrid(value: unknown): HeatmapGrid {
  const record = requireRecord(value, "heatmap");
  const columns = finite(record, ["columns", "width"], "heatmap columns");
  const rows = finite(record, ["rows", "height"], "heatmap rows");
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns <= 0 || rows <= 0 || !Array.isArray(record.values) || !record.values.every(isFiniteNumber)) throw new Error("Heatmap grid is invalid.");
  return { columns, rows, values: record.values };
}

function parseAreaInsights(value: unknown): readonly AreaInsight[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((insight) => {
    const record = requireRecord(insight, "area insight");
    return { x: finite(record, ["x", "px"], "area x"), y: finite(record, ["y", "py"], "area y"), radius: isFiniteNumber(record.radius) ? record.radius : undefined, statistics: statistics(record.statistics) };
  });
}

export function parseMetadata(value: unknown): AtlasMetadata {
  const record = requireRecord(value, "metadata.json");
  if (!Array.isArray(record.matches)) throw new Error("metadata.json is missing its matches array.");
  const matches: MatchIndexItem[] = record.matches.map((item, index) => {
    const entry = requireRecord(item, `metadata match ${index}`);
    const id = readText(entry, ["id", "matchId"], "match id");
    return { id, mapId: readText(entry, ["mapId", "map"], "map id"), date: readText(entry, ["date"], "date"), file: typeof entry.file === "string" ? entry.file : `/data/matches/${id}.json` };
  });
  return { matches };
}

export function parseMaps(value: unknown): readonly AtlasMap[] {
  const list = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.maps) ? value.maps : null;
  if (list === null) throw new Error("maps.json must be an array or contain a maps array.");
  return list.map((map, index) => {
    const record = requireRecord(map, `map ${index}`);
    return { id: readText(record, ["id", "mapId"], "map id"), name: typeof record.name === "string" ? record.name : readText(record, ["id", "mapId"], "map id"), image: typeof record.image === "string" ? record.image : typeof record.imagePath === "string" ? record.imagePath : undefined };
  });
}

export function parseMatch(value: unknown): ParsedAtlasMatch {
  const record = requireRecord(value, "match JSON");
  if (!Array.isArray(record.players) || !Array.isArray(record.events)) throw new Error("Match JSON requires players and events arrays.");
  const heatmapsRecord = isRecord(record.heatmaps) ? record.heatmaps : {};
  const heatmaps: ParsedAtlasMatch["heatmaps"] = {};
  for (const kind of ["traffic", "kills", "deaths"] as const) if (heatmapsRecord[kind] !== undefined) heatmaps[kind] = parseGrid(heatmapsRecord[kind]);
  return { matchId: readText(record, ["matchId", "id"], "match id"), mapId: readText(record, ["mapId", "map"], "map id"), date: typeof record.date === "string" ? record.date : undefined, duration: finite(record, ["duration"], "match duration"), players: record.players.map(parsePlayer), events: record.events.map(parseEvent), statistics: statistics(record.statistics), areaInsights: parseAreaInsights(record.areaInsights), heatmaps };
}

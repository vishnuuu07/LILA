import type { HeatmapGrid, RenderMatch, RendererEvent, RendererPlayer } from "../renderer/MapRenderer";

export type ActorType = "human" | "bot";
export type HeatmapKind = "none" | "traffic" | "kills" | "deaths";

export interface MatchIndexItem {
  id: string;
  mapId: string;
  date: string;
  file: string;
}

export interface AtlasMetadata {
  matches: readonly MatchIndexItem[];
}

export interface AtlasMap {
  id: string;
  name: string;
  image?: string;
}

export interface MatchStatistics {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AreaInsight {
  x: number;
  y: number;
  radius?: number;
  statistics: MatchStatistics;
}

export interface AtlasMatch extends RenderMatch {
  matchId: string;
  date?: string;
  statistics: MatchStatistics;
  areaInsights?: readonly AreaInsight[];
}

export interface PlayerDetail extends RendererPlayer {
  actorType: ActorType;
  displayName?: string;
  spawnTime?: number;
  deathTime?: number;
  survivalTime?: number;
  eventCount?: number;
  pathLength?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface EventDetail extends RendererEvent {
  details?: Record<string, string | number | boolean | null>;
}

export interface ParsedAtlasMatch extends AtlasMatch {
  players: readonly PlayerDetail[];
  events: readonly EventDetail[];
  heatmaps?: Partial<Record<"traffic" | "kills" | "deaths", HeatmapGrid>>;
}

export type AnalyticsModule = "entities" | "cohorts" | "flow";
export type Cohort = "all" | "firstSession" | "returning" | "frequent";
export type EntityKey = "humans" | "bots" | "loot" | "pvpKills" | "botKills" | "playerDeaths" | "stormDeaths";
export interface EntityMap { grids: Record<EntityKey, number[]>; counters: Record<string, number | null>; }
export interface EntityDistribution { gridSize: number; maps: Record<string, EntityMap>; }
export interface FlowCell { id: number; traffic: number; loot: number; pvpKills: number; botKills: number; playerDeaths: number; stormDeaths: number; botEncounters: number; playerEncounters: number; neighbours: number[]; }
export interface FlowAnalysis { gridSize: number; maps: Record<string, { cells: FlowCell[] }>; }
export interface CohortSession { date: string; mapId: string; survivalTime: number; eventCount: number; }
export interface CohortPlayer { id: string; cohort: Exclude<Cohort, "all">; matchCount: number; firstDate: string; lastDate: string; sessions: CohortSession[]; }
export interface PlayerCohorts { players: CohortPlayer[]; daily: { date: string; active: number; new: number; returning: number }[]; }
export interface AnalyticsData { entities: EntityDistribution; flow: FlowAnalysis; cohorts: PlayerCohorts; }

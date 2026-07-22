import { useEffect, useState } from "react";
import type { AnalyticsData, EntityDistribution, FlowAnalysis, PlayerCohorts } from "../types";

type State = { status: "loading" | "ready" | "error"; data: AnalyticsData | null };
const initial: State = { status: "loading", data: null };
async function load<T>(path: string): Promise<T> { const response = await fetch(path); if (!response.ok) throw new Error(`Unable to load ${path}`); return response.json() as Promise<T>; }
export function useAnalytics(): State {
  const [state, setState] = useState<State>(initial);
  useEffect(() => { let active = true; Promise.all([load<EntityDistribution>("/data/analytics/entity-distribution.json"), load<PlayerCohorts>("/data/analytics/player-cohorts.json"), load<FlowAnalysis>("/data/analytics/flow-analysis.json")]).then(([entities, cohorts, flow]) => { if (active) setState({ status: "ready", data: { entities, cohorts, flow } }); }).catch(() => { if (active) setState({ status: "error", data: null }); }); return () => { active = false; }; }, []);
  return state;
}

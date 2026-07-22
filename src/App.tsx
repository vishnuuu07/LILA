import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Compass } from "lucide-react";
import { FilterRail } from "./components/FilterRail";
import { InspectorPanel } from "./components/InspectorPanel";
import { MapCanvas } from "./components/MapCanvas";
import { PlaybackBar } from "./components/PlaybackBar";
import { StatusView } from "./components/StatusView";
import { ResizeHandle } from "./components/ResizeHandle";
import { useAtlasData } from "./hooks/useAtlasData";
import type { AnalyticsOverlay, InsightGrid, RendererEvent, SelectionArea } from "./renderer/MapRenderer";
import type { HeatmapKind } from "./types/atlas";
import { temporalHeatmap } from "./utils/matchAnalytics";
import { AnalyticsWorkbench } from "./analytics/AnalyticsWorkbench";
import type { Cohort } from "./analytics/types";
import { useAnalytics } from "./analytics/hooks/useAnalytics";

export default function App() {
  const data = useAtlasData();
  const [selectedMap, setSelectedMap] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState({ paths: true, events: true, loot: true, storm: true });
  const [heatmap, setHeatmap] = useState<HeatmapKind>("none");
  const [opacity, setOpacity] = useState(0.65);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [comparisonPlayerIds, setComparisonPlayerIds] = useState<readonly string[]>([]);
  const [hoveredEvent, setHoveredEvent] = useState<RendererEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<RendererEvent | null>(null);
  const [area, setArea] = useState<SelectionArea | null>(null);
  const [insightGrid, setInsightGrid] = useState<InsightGrid | null>(null);
  const [leftRailWidth, setLeftRailWidth] = useState(212);
  const [rightRailWidth, setRightRailWidth] = useState(270);
  const [cohort, setCohort] = useState<Cohort>("all");
  const [analyticsOverlays, setAnalyticsOverlays] = useState<readonly AnalyticsOverlay[]>([]);
  const analytics = useAnalytics();
  const timeRef = useRef(0);

  const indexedMatches = data.metadata?.matches ?? [];
  const maps = data.maps.filter((map) => indexedMatches.some((match) => match.mapId === map.id));
  const dates = useMemo(() => [...new Set(indexedMatches.filter((match) => match.mapId === selectedMap).map((match) => match.date))].sort(), [indexedMatches, selectedMap]);
  const matches = useMemo(() => indexedMatches.filter((match) => match.mapId === selectedMap && match.date === selectedDate && (!query || match.id.toLowerCase().includes(query.trim().toLowerCase()))).map((match) => ({ id: match.id, label: match.id.length > 20 ? `${match.id.slice(0, 12)}…${match.id.slice(-6)}` : match.id })), [indexedMatches, selectedMap, selectedDate, query]);
  const selectedIndex = indexedMatches.find((match) => match.id === selectedMatchId) ?? null;
  const duration = data.match?.duration ?? 0;
  const visibleMatch = useMemo(() => {
    if (data.match === null || cohort === "all" || analytics.data === null) return data.match;
    const ids = new Set(analytics.data.cohorts.players.filter((player) => player.cohort === cohort).map((player) => player.id));
    return { ...data.match, players: data.match.players.filter((player) => ids.has(player.id)), events: data.match.events.filter((event) => ids.has(event.playerId)) };
  }, [data.match, cohort, analytics.data]);

  useEffect(() => { if (!selectedMap && maps.length > 0) setSelectedMap(maps[0].id); }, [selectedMap, maps]);
  useEffect(() => { setSelectedDate(""); setSelectedMatchId(""); setTime(0); setPlaying(false); }, [selectedMap]);
  useEffect(() => { if (!selectedDate && dates.length > 0) setSelectedDate(dates[0]); }, [selectedDate, dates]);
  useEffect(() => { if (selectedDate && matches.length > 0 && !matches.some((match) => match.id === selectedMatchId)) setSelectedMatchId(matches[0].id); }, [selectedDate, matches, selectedMatchId]);
  useEffect(() => { if (selectedIndex) void data.loadMatch(selectedIndex.file); }, [selectedIndex?.file]);
  useEffect(() => { timeRef.current = time; }, [time]);
  const updateTime = useCallback((next: number) => { const bounded = Math.max(0, Math.min(duration, next)); timeRef.current = bounded; setTime(bounded); }, [duration]);
  useEffect(() => { setTime(0); timeRef.current = 0; setPlaying(false); setSelectedPlayerId(null); setComparisonPlayerIds([]); setSelectedEvent(null); setArea(null); setInsightGrid(null); }, [data.match?.matchId]);
  useEffect(() => { if (selectedPlayerId !== null && !visibleMatch?.players.some((player) => player.id === selectedPlayerId)) setSelectedPlayerId(null); if (selectedEvent !== null && !visibleMatch?.events.some((event) => event.id === selectedEvent.id)) setSelectedEvent(null); }, [visibleMatch, selectedPlayerId, selectedEvent]);
  useEffect(() => { if (!playing || duration <= 0) return; let frame = 0; let previous = performance.now(); const animate = (now: number) => { const next = Math.min(duration, timeRef.current + ((now - previous) / 1000) * speed); previous = now; updateTime(next); if (next < duration) frame = requestAnimationFrame(animate); else setPlaying(false); }; frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame); }, [playing, duration, speed, updateTime]);

  const step = useCallback((amount: number) => updateTime(timeRef.current + amount), [updateTime]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return; if (event.code === "Space") { event.preventDefault(); if (duration > 0) setPlaying((active) => !active); } else if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); } else if (event.key === "ArrowRight") { event.preventDefault(); step(1); } else if (event.key.toLowerCase() === "h") setHeatmap((current) => current === "none" ? "traffic" : "none"); else if (event.key.toLowerCase() === "p") setLayers((current) => ({ ...current, paths: !current.paths })); else if (event.key.toLowerCase() === "e") setLayers((current) => ({ ...current, events: !current.events })); else if (event.key === "Escape") { setSelectedPlayerId(null); setComparisonPlayerIds([]); setSelectedEvent(null); setArea(null); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [duration, step]);

  const setMap = (value: string) => setSelectedMap(value);
  const setDate = (value: string) => setSelectedDate(value);
  const toggleLayer = (layer: "paths" | "events" | "loot" | "storm") => setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  const heatmapGrid = useMemo(() => visibleMatch ? temporalHeatmap(visibleMatch, heatmap, time) : undefined, [visibleMatch, heatmap, time]);
  const selectPlayer = useCallback((id: string | null) => {
    setSelectedPlayerId(id);
    setComparisonPlayerIds((current) => id !== null && current.includes(id) ? current : []);
  }, []);
  const setComparison = useCallback((ids: readonly string[]) => {
    const next = [...ids];
    setComparisonPlayerIds(next);
    if (next.length === 0) setSelectedPlayerId(null);
  }, []);

  if (data.state === "error") return <main className="startup"><header className="brand"><Compass size={20} /><span>ATLAS</span><small>PLAYER JOURNEY EXPLORER</small></header><StatusView title="Telemetry data is not available" detail={`ATLAS expects /public/data/metadata.json and maps.json. ${data.error ?? ""}`} retry={data.retry} /></main>;
  return <main className="app-shell"><header className="topbar"><div className="brand"><Compass size={20} /><span>ATLAS</span><small>PLAYER JOURNEY EXPLORER</small></div></header><div className="workspace" style={{ "--left-rail": `${leftRailWidth}px`, "--right-rail": `${rightRailWidth}px` } as React.CSSProperties}>
    <FilterRail maps={maps} dates={dates} matches={matches} selectedMap={selectedMap} selectedDate={selectedDate} selectedMatch={selectedMatchId} query={query} disabled={data.state !== "ready"} layers={layers} heatmap={heatmap} opacity={opacity} onMap={setMap} onDate={setDate} onMatch={setSelectedMatchId} onQuery={setQuery} onLayer={toggleLayer} onHeatmap={setHeatmap} onOpacity={setOpacity} workbench={<AnalyticsWorkbench mapId={selectedMap} cohort={cohort} onCohort={setCohort} onOverlays={setAnalyticsOverlays} onFlowCell={setInsightGrid} />} />
    <ResizeHandle side="left" value={leftRailWidth} min={180} max={420} onChange={setLeftRailWidth} />
    <section className="map-workspace"><MapCanvas match={visibleMatch} state={data.matchState} error={data.matchError} playbackTime={time} selectedPlayerId={selectedPlayerId} comparisonPlayerIds={comparisonPlayerIds} selectedEvent={selectedEvent} area={area} insightGrid={insightGrid} heatmap={heatmap} heatmapGrid={heatmapGrid} heatmapOpacity={opacity} layers={layers} analyticsOverlays={analyticsOverlays} onHoverEvent={setHoveredEvent} onSelectEvent={setSelectedEvent} onSelectPlayer={selectPlayer} onArea={setArea} /><PlaybackBar duration={duration} time={time} playing={playing} speed={speed} disabled={data.matchState !== "ready"} onPlay={() => setPlaying((current) => !current)} onRestart={() => { setPlaying(false); updateTime(0); }} onTime={(next) => { setPlaying(false); updateTime(next); }} onSpeed={setSpeed} /></section>
    <ResizeHandle side="right" value={rightRailWidth} min={180} max={420} onChange={setRightRailWidth} />
    <InspectorPanel match={visibleMatch} selectedPlayerId={selectedPlayerId} comparisonPlayerIds={comparisonPlayerIds} selectedEvent={selectedEvent} hoveredEvent={hoveredEvent} area={area} onPlayer={selectPlayer} onComparison={setComparison} onClearArea={() => setArea(null)} onInsightGrid={setInsightGrid} />
  </div></main>;
}

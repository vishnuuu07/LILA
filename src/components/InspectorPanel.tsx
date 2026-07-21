import { Activity, CircleGauge, Crosshair, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { RendererEvent, SelectionArea } from "../renderer/MapRenderer";
import type { AreaInsight, ParsedAtlasMatch, PlayerDetail } from "../types/atlas";

interface InspectorPanelProps { match: ParsedAtlasMatch | null; selectedPlayerId: string | null; selectedEvent: RendererEvent | null; hoveredEvent: RendererEvent | null; area: SelectionArea | null; onPlayer: (id: string | null) => void; onClearArea: () => void; }

const titleize = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
const display = (value: string | number | boolean | null | undefined) => value === null || value === undefined ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value);

export function InspectorPanel({ match, selectedPlayerId, selectedEvent, hoveredEvent, area, onPlayer, onClearArea }: InspectorPanelProps) {
  const player = match?.players.find((candidate) => candidate.id === selectedPlayerId) ?? null;
  const nearbyInsight = findInsight(match?.areaInsights, area);
  const event = selectedEvent ?? hoveredEvent;
  return <aside className="inspector" aria-label="Match inspector">
    <section className="inspector-section"><div className="section-heading"><Users size={15} /><h2>Player focus</h2></div>{match ? <><select aria-label="Selected player" value={selectedPlayerId ?? ""} onChange={(event) => onPlayer(event.target.value || null)}><option value="">All players</option>{match.players.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.displayName ?? shortId(candidate.id)} · {candidate.actorType}</option>)}</select><PlayerDetails player={player} /></> : <Muted>Load a match to inspect player journeys.</Muted>}</section>
    <section className="inspector-section"><div className="section-heading"><Crosshair size={15} /><h2>Event focus</h2></div>{event ? <EventDetails event={event} /> : <Muted>Click or hover an event marker on the map.</Muted>}</section>
    <section className="inspector-section"><div className="section-heading"><CircleGauge size={15} /><h2>Area inspector</h2></div>{area ? <><p className="area-position">{Math.round(area.x)}, {Math.round(area.y)} <button type="button" onClick={onClearArea}>Clear</button></p>{nearbyInsight ? <Stats values={nearbyInsight.statistics} /> : <Muted>No precomputed area insight is available at this location.</Muted>}</> : <Muted>Click the map to draw an inspection radius.</Muted>}</section>
    <section className="inspector-section summary"><div className="section-heading"><Activity size={15} /><h2>Match summary</h2></div>{match ? <Stats values={match.statistics} /> : <Muted>Summary values appear after the match file loads.</Muted>}</section>
  </aside>;
}

function PlayerDetails({ player }: { player: PlayerDetail | null }) { if (!player) return <Muted>Click a player path or choose a player to highlight their route.</Muted>; return <dl className="detail-list"><Detail label="Identity" value={player.displayName ?? shortId(player.id)} /><Detail label="Actor" value={player.actorType} /><Detail label="Spawn" value={timeOrDash(player.spawnTime)} /><Detail label="Death" value={timeOrDash(player.deathTime)} /><Detail label="Survival" value={timeOrDash(player.survivalTime)} /><Detail label="Events" value={player.eventCount ?? "â€”"} /><Detail label="Path length" value={player.pathLength ?? "â€”"} /><Detail label="Journey points" value={player.journey.length} />{Object.entries(player.metadata ?? {}).slice(0, 4).map(([label, value]) => <Detail key={label} label={titleize(label)} value={display(value)} />)}</dl>; }
function EventDetails({ event }: { event: RendererEvent }) { const details = "details" in event && event.details ? event.details : {}; return <dl className="detail-list"><Detail label="Event" value={event.type} /><Detail label="Player" value={shortId(event.playerId)} /><Detail label="Timeline" value={formatTime(event.t)} /><Detail label="Coordinates" value={`${Math.round(event.x)}, ${Math.round(event.y)}`} />{Object.entries(details).map(([label, value]) => <Detail key={label} label={titleize(label)} value={display(value)} />)}</dl>; }
function Stats({ values }: { values: Record<string, string | number | boolean | null | undefined> }) { const entries = Object.entries(values); return entries.length > 0 ? <dl className="stats">{entries.map(([key, value]) => <div key={key}><dt>{titleize(key)}</dt><dd>{display(value)}</dd></div>)}</dl> : <Muted>No supplied statistics.</Muted>; }
function Detail({ label, value }: { label: string; value: string | number }) { return <><dt>{label}</dt><dd>{value}</dd></>; }
function Muted({ children }: { children: ReactNode }) { return <p className="muted">{children}</p>; }
function shortId(value: string): string { return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value; }
function formatTime(seconds: number): string { const safe = Math.max(0, Math.floor(seconds)); return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`; }
function timeOrDash(value: number | undefined): string { return value === undefined ? "â€”" : formatTime(value); }
function findInsight(insights: readonly AreaInsight[] | undefined, area: SelectionArea | null): AreaInsight | null { if (!insights || !area) return null; return insights.find((insight) => Math.hypot(insight.x - area.x, insight.y - area.y) <= (insight.radius ?? area.radius)) ?? null; }

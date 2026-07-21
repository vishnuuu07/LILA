import { Activity, ChevronDown, CircleGauge, Crosshair, GitCompareArrows, Lightbulb, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { RendererEvent, SelectionArea } from "../renderer/MapRenderer";
import type { ParsedAtlasMatch, PlayerDetail } from "../types/atlas";
import { inspectArea, playerEventCounts, quickInsights } from "../utils/matchAnalytics";

interface InspectorPanelProps {
  match: ParsedAtlasMatch | null;
  selectedPlayerId: string | null;
  comparisonPlayerIds: readonly string[];
  selectedEvent: RendererEvent | null;
  hoveredEvent: RendererEvent | null;
  area: SelectionArea | null;
  onPlayer: (id: string | null) => void;
  onComparison: (ids: readonly string[]) => void;
  onClearArea: () => void;
}

const titleize = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
const display = (value: string | number | boolean | null | undefined) => value === null || value === undefined ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value);

export function InspectorPanel({ match, selectedPlayerId, comparisonPlayerIds, selectedEvent, hoveredEvent, area, onPlayer, onComparison, onClearArea }: InspectorPanelProps) {
  const player = match?.players.find((candidate) => candidate.id === selectedPlayerId) ?? null;
  const event = selectedEvent ?? hoveredEvent;
  const areaInsight = match && area ? inspectArea(match, area) : null;
  const insights = match ? quickInsights(match) : [];
  return <aside className="inspector" aria-label="Match inspector">
    <InspectorSection icon={<Users size={15} />} title="Player focus">
      {match ? <><select aria-label="Selected player" value={selectedPlayerId ?? ""} onChange={(event) => onPlayer(event.target.value || null)}><option value="">All players</option>{match.players.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.displayName ?? shortId(candidate.id)} · {candidate.actorType}</option>)}</select><PlayerDetails player={player} /></> : <Muted>Load a match to inspect player journeys.</Muted>}
    </InspectorSection>
    <InspectorSection icon={<GitCompareArrows size={15} />} title="Journey comparison">
      <JourneyComparison match={match} selectedIds={comparisonPlayerIds} onChange={onComparison} />
    </InspectorSection>
    <InspectorSection icon={<Crosshair size={15} />} title="Event focus">
      {event ? <EventDetails event={event} /> : <Muted>Click or hover an event marker on the map.</Muted>}
    </InspectorSection>
    <InspectorSection icon={<CircleGauge size={15} />} title="Area inspector">
      {area && areaInsight ? <AreaDetails area={area} insight={areaInsight} onClear={onClearArea} /> : <Muted>Click the map to draw an inspection radius. Escape clears the lens.</Muted>}
    </InspectorSection>
    <InspectorSection icon={<Lightbulb size={15} />} title="Quick insights">
      {insights.length ? <div className="insight-stack">{insights.map((insight) => <article className={`insight-card ${insight.tone}`} key={insight.id}><span>{insight.label}</span><strong>{insight.value}</strong><small>{insight.evidence}</small></article>)}</div> : <Muted>No evidence-backed insight is available for this match.</Muted>}
    </InspectorSection>
    <InspectorSection icon={<Activity size={15} />} title="Match summary" className="summary">
      {match ? <Stats values={match.statistics} /> : <Muted>Summary values appear after the match file loads.</Muted>}
    </InspectorSection>
  </aside>;
}

function InspectorSection({ icon, title, children, className = "" }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return <section className={`inspector-section ${className}`}><details open><summary><span className="section-heading">{icon}<h2>{title}</h2></span><ChevronDown size={14} aria-hidden="true" /></summary><div className="section-body">{children}</div></details></section>;
}

function JourneyComparison({ match, selectedIds, onChange }: { match: ParsedAtlasMatch | null; selectedIds: readonly string[]; onChange: (ids: readonly string[]) => void }) {
  if (!match) return <Muted>Load a match to compare two captured journeys.</Muted>;
  if (match.players.length < 2) return <Muted>This match contains one captured player journey; comparison needs two.</Muted>;
  const toggle = (id: string): void => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((candidate) => candidate !== id));
    else if (selectedIds.length < 2) onChange([...selectedIds, id]);
  };
  const players = selectedIds.map((id) => match.players.find((candidate) => candidate.id === id)).filter((player): player is PlayerDetail => Boolean(player));
  return <><p className="comparison-hint">Pick two players. The first route remains the bright blue primary path; the companion keeps its actor color.</p><div className="compare-picker" role="group" aria-label="Choose two players to compare">{match.players.map((player) => {
    const checked = selectedIds.includes(player.id);
    const disabled = !checked && selectedIds.length >= 2;
    return <label key={player.id} className={`compare-option ${checked ? "active" : ""}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(player.id)} /><i className={player.isBot ? "amber" : "cyan"} />{player.displayName ?? shortId(player.id)}<small>{player.actorType}</small></label>;
  })}</div>{players.length === 2 ? <><div className="compare-key"><span><i className="blue" />Primary / selected route</span><span><i className={players[1].isBot ? "amber" : "cyan"} />Companion route</span></div><div className="comparison-table">{players.map((player, index) => <PlayerComparison key={player.id} player={player} match={match} label={index === 0 ? "Primary" : "Companion"} />)}</div><button className="text-button" type="button" onClick={() => onChange([])}>Clear comparison</button></> : <p className="comparison-status">{players.length}/2 selected · choose {2 - players.length} more.</p>}</>;
}

function PlayerComparison({ player, match, label }: { player: PlayerDetail; match: ParsedAtlasMatch; label: string }) {
  const events = playerEventCounts(player, match);
  return <article className="comparison-player"><h3>{label}<small>{player.displayName ?? shortId(player.id)}</small></h3><dl><Detail label="Survival" value={timeOrDash(player.survivalTime)} /><Detail label="Path" value={player.pathLength === undefined ? "—" : `${Math.round(player.pathLength)} px`} /><Detail label="Events" value={player.eventCount ?? match.events.filter((event) => event.playerId === player.id).length} /><Detail label="Engage" value={events.engagement} /><Detail label="Loot" value={events.loot} /><Detail label="Outcome" value={events.outcome} /></dl></article>;
}

function AreaDetails({ area, insight, onClear }: { area: SelectionArea; insight: ReturnType<typeof inspectArea>; onClear: () => void }) {
  return <><p className="area-position"><span>{Math.round(area.x)}, {Math.round(area.y)} · r {Math.round(area.radius)}</span><button type="button" onClick={onClear}>Clear</button></p><p className="area-method">Average dwell is estimated from sampled journey intervals whose starting point is inside this radius.</p><dl className="stats area-stats"><Stat label="Players passed" value={insight.playersPassed} /><Stat label="Humans" value={insight.humans} /><Stat label="Bots" value={insight.bots} /><Stat label="Kills" value={insight.kills} /><Stat label="Deaths" value={insight.deaths} /><Stat label="Loot" value={insight.loot} /><Stat label="Storm deaths" value={insight.stormDeaths} /><Stat label="First activity" value={timeOrDash(insight.firstActivity ?? undefined)} /><Stat label="Last activity" value={timeOrDash(insight.lastActivity ?? undefined)} /><Stat label="Peak activity" value={timeOrDash(insight.peakActivity ?? undefined)} /><Stat label="Average dwell" value={`${Math.round(insight.averageDwell)} s`} /></dl></>;
}

function PlayerDetails({ player }: { player: PlayerDetail | null }) { if (!player) return <Muted>Click a player path or choose a player to highlight their route.</Muted>; return <dl className="detail-list"><Detail label="Identity" value={player.displayName ?? shortId(player.id)} /><Detail label="Actor" value={player.actorType} /><Detail label="Spawn" value={timeOrDash(player.spawnTime)} /><Detail label="Death" value={timeOrDash(player.deathTime)} /><Detail label="Survival" value={timeOrDash(player.survivalTime)} /><Detail label="Events" value={player.eventCount ?? "—"} /><Detail label="Path length" value={player.pathLength === undefined ? "—" : `${Math.round(player.pathLength)} px`} /><Detail label="Journey points" value={player.journey.length} /></dl>; }
function EventDetails({ event }: { event: RendererEvent }) { const details = "details" in event && event.details ? event.details : {}; return <dl className="detail-list"><Detail label="Event" value={event.type} /><Detail label="Player" value={shortId(event.playerId)} /><Detail label="Timeline" value={formatTime(event.t)} /><Detail label="Coordinates" value={`${Math.round(event.x)}, ${Math.round(event.y)}`} />{Object.entries(details).map(([label, value]) => <Detail key={label} label={titleize(label)} value={display(value)} />)}</dl>; }
function Stats({ values }: { values: Record<string, string | number | boolean | null | undefined> }) { const entries = Object.entries(values); return entries.length > 0 ? <dl className="stats">{entries.map(([key, value]) => <Stat key={key} label={titleize(key)} value={display(value)} />)}</dl> : <Muted>No supplied statistics.</Muted>; }
function Stat({ label, value }: { label: string; value: string | number }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function Detail({ label, value }: { label: string | number; value: string | number }) { return <><dt>{label}</dt><dd>{value}</dd></>; }
function Muted({ children }: { children: ReactNode }) { return <p className="muted">{children}</p>; }
function shortId(value: string): string { return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value; }
function formatTime(seconds: number): string { const safe = Math.max(0, Math.floor(seconds)); return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`; }
function timeOrDash(value: number | undefined): string { return value === undefined ? "—" : formatTime(value); }

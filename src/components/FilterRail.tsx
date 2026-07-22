import { Layers3, Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { HeatmapKind } from "../types/atlas";

interface FilterRailProps {
  maps: readonly { id: string; name: string }[];
  dates: readonly string[];
  matches: readonly { id: string; label: string }[];
  selectedMap: string;
  selectedDate: string;
  selectedMatch: string;
  query: string;
  disabled: boolean;
  layers: { paths: boolean; events: boolean; loot: boolean; storm: boolean };
  heatmap: HeatmapKind;
  opacity: number;
  onMap: (value: string) => void;
  onDate: (value: string) => void;
  onMatch: (value: string) => void;
  onQuery: (value: string) => void;
  onLayer: (layer: "paths" | "events" | "loot" | "storm") => void;
  onHeatmap: (kind: HeatmapKind) => void;
  onOpacity: (value: number) => void;
  workbench?: ReactNode;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }

export function FilterRail(props: FilterRailProps) {
  const { maps, dates, matches, selectedMap, selectedDate, selectedMatch, query, disabled, layers, heatmap, opacity, onMap, onDate, onMatch, onQuery, onLayer, onHeatmap, onOpacity, workbench } = props;
  return <aside className="left-rail" aria-label="Filters and layers">
    <section className="rail-section"><div className="section-heading"><SlidersHorizontal size={15} /><h2>Match filters</h2></div>
      <Field label="Map"><select value={selectedMap} onChange={(event) => onMap(event.target.value)} disabled={disabled}>{maps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}</select></Field>
      <Field label="Date"><select value={selectedDate} onChange={(event) => onDate(event.target.value)} disabled={disabled || !selectedMap}><option value="">Select a date</option>{dates.map((date) => <option key={date} value={date}>{date}</option>)}</select></Field>
      <Field label="Match"><select value={selectedMatch} onChange={(event) => onMatch(event.target.value)} disabled={disabled || !selectedDate}><option value="">Select a match</option>{matches.map((match) => <option key={match.id} value={match.id}>{match.label}</option>)}</select></Field>
      <label className="search"><Search size={15} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search match ID" disabled={disabled} /></label>
    </section>
    {workbench}
    <section className="rail-section"><div className="section-heading"><Layers3 size={15} /><h2>Layers</h2></div>
      <Toggle label="Player paths" checked={layers.paths} onChange={() => onLayer("paths")} shortcut="P" />
      <Toggle label="Event markers" checked={layers.events} onChange={() => onLayer("events")} shortcut="E" />
      <Toggle label="Loot markers" checked={layers.loot} onChange={() => onLayer("loot")} />
      <Toggle label="Storm deaths" checked={layers.storm} onChange={() => onLayer("storm")} />
      <div className="heatmap-controls"><span className="field-label">Heatmap <kbd>H</kbd></span>{(["none", "traffic", "kills", "deaths"] as const).map((kind) => <label key={kind} className="radio-row"><input type="radio" name="heatmap" checked={heatmap === kind} onChange={() => onHeatmap(kind)} /> <span>{kind === "none" ? "Off" : kind === "traffic" ? "Player movement" : kind === "kills" ? "Credited eliminations" : "Eliminations suffered"}</span></label>)}
      {heatmap !== "none" && <p className="heatmap-note">Density runs lime → yellow → orange → red. Credited and suffered records are independent; storm is included in suffered.</p>}
      {heatmap !== "none" && <Field label="Opacity"><input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(event) => onOpacity(Number(event.target.value))} /></Field>}</div>
    </section>
    <section className="legend" aria-label="Map legend"><span className="legend-title">Journeys</span><Legend color="cyan" label="Human route" /><Legend color="amber" label="Bot route" /><span className="legend-title">Event markers</span><Legend color="red" label="Elimination credited" /><Legend color="orange" label="Player eliminated" /><Legend color="gold" label="Loot" /><Legend color="purple" label="Eliminated by storm" /><span className="legend-title">Analysis overlays</span><Legend color="blue" label="Inspection lens" /><Legend color="mint" label="Insight grid cell" /></section>
    <section className="shortcuts"><span>Keyboard</span><p><kbd>Space</kbd> play/pause</p><p><kbd>←</kbd><kbd>→</kbd> step • <kbd>Esc</kbd> clear</p></section>
  </aside>;
}

function Toggle({ label, checked, onChange, shortcut }: { label: string; checked: boolean; onChange: () => void; shortcut?: string }) { return <label className="toggle-row"><input type="checkbox" checked={checked} onChange={onChange} /><span>{label}</span>{shortcut && <kbd>{shortcut}</kbd>}</label>; }
function Legend({ color, label }: { color: string; label: string }) { return <span className="legend-item"><i className={`swatch ${color}`} />{label}</span>; }

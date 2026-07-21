import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Crosshair, LoaderCircle, MapPinned, MousePointer2 } from "lucide-react";
import { MapRenderer, type RendererEvent, type SelectionArea } from "../renderer/MapRenderer";
import type { HeatmapKind, ParsedAtlasMatch } from "../types/atlas";

const mapImages: Readonly<Record<string, string>> = {
  AmbroseValley: new URL("../../player_data/minimaps/AmbroseValley_Minimap.png", import.meta.url).href,
  GrandRift: new URL("../../player_data/minimaps/GrandRift_Minimap.png", import.meta.url).href,
  Lockdown: new URL("../../player_data/minimaps/Lockdown_Minimap.jpg", import.meta.url).href,
};

interface MapCanvasProps {
  match: ParsedAtlasMatch | null;
  state: "loading" | "ready" | "error";
  error: string | null;
  playbackTime: number;
  selectedPlayerId: string | null;
  selectedEvent: RendererEvent | null;
  area: SelectionArea | null;
  heatmap: HeatmapKind;
  heatmapOpacity: number;
  layers: { paths: boolean; events: boolean; loot: boolean; storm: boolean };
  onHoverEvent: (event: RendererEvent | null) => void;
  onSelectEvent: (event: RendererEvent | null) => void;
  onSelectPlayer: (playerId: string | null) => void;
  onArea: (area: SelectionArea | null) => void;
}

export function MapCanvas(props: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MapRenderer | null>(null);
  const [hovered, setHovered] = useState<RendererEvent | null>(null);
  const displayMatch = useMemo(() => props.match === null ? null : ({ ...props.match, events: props.match.events.filter((event) => (props.layers.loot || event.type !== "Loot") && (props.layers.storm || event.type !== "KilledByStorm")) }), [props.match, props.layers.loot, props.layers.storm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const renderer = new MapRenderer(canvas, { mapImages, onHoverEvent: (event) => { setHovered(event); props.onHoverEvent(event); } });
    rendererRef.current = renderer;
    const observer = new ResizeObserver(() => renderer.resize());
    observer.observe(canvas);
    return () => { observer.disconnect(); renderer.destroy(); rendererRef.current = null; };
  }, [props.onHoverEvent]);

  useEffect(() => {
    if (displayMatch === null) return;
    rendererRef.current?.loadMatch(displayMatch);
    rendererRef.current?.setSelectedPlayer(props.selectedPlayerId);
    rendererRef.current?.setSelectedEvent(props.selectedEvent);
    rendererRef.current?.setSelectedArea(props.area);
  }, [displayMatch, props.selectedPlayerId, props.selectedEvent, props.area]);
  useEffect(() => { rendererRef.current?.setPlaybackTime(props.playbackTime); }, [props.playbackTime]);
  useEffect(() => { rendererRef.current?.setSelectedPlayer(props.selectedPlayerId); }, [props.selectedPlayerId]);
  useEffect(() => { rendererRef.current?.setSelectedEvent(props.selectedEvent); }, [props.selectedEvent]);
  useEffect(() => { rendererRef.current?.setSelectedArea(props.area); }, [props.area]);
  useEffect(() => { rendererRef.current?.toggleLayer("paths", props.layers.paths); rendererRef.current?.toggleLayer("events", props.layers.events); }, [props.layers.paths, props.layers.events]);
  useEffect(() => { rendererRef.current?.toggleLayer("heatmap", props.heatmap !== "none"); if (props.heatmap !== "none") rendererRef.current?.setHeatmap(props.heatmap, props.heatmapOpacity); }, [props.heatmap, props.heatmapOpacity]);

  const selectMapTarget = (event: MouseEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    if (renderer === null || props.match === null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const selectedEvent = renderer.hitTestEvent(screenX, screenY);
    if (selectedEvent !== null) {
      props.onSelectEvent(selectedEvent);
      props.onSelectPlayer(null);
      return;
    }
    const selectedPlayer = renderer.hitTestPlayer(screenX, screenY);
    if (selectedPlayer !== null) {
      props.onSelectPlayer(selectedPlayer.id);
      props.onSelectEvent(null);
      return;
    }
    props.onSelectEvent(null);
    const point = renderer.screenToMap(screenX, screenY);
    if (point.x >= 0 && point.x <= 1024 && point.y >= 0 && point.y <= 1024) props.onArea({ ...point, radius: 75 });
  };

  const resetView = (): void => rendererRef.current?.resetView();

  return <section className="map-stage" aria-label="Interactive match map"><canvas ref={canvasRef} onClick={selectMapTarget} onDoubleClick={resetView} aria-label="Match map. Drag to pan, scroll to zoom, click a path or marker to inspect it, or click open space to inspect an area. Double click resets the map." />
    <div className="map-chrome"><span><MapPinned size={15} /> {props.match?.mapId ?? "Awaiting data"}</span><span><MousePointer2 size={14} /> Drag to pan · Scroll to zoom</span></div>
    {hovered && <div className="event-tooltip" role="tooltip"><Crosshair size={14} /><strong>{hovered.type}</strong><span>t {formatTime(hovered.t)}</span></div>}
    {props.state === "loading" && <Overlay icon={<LoaderCircle className="spin" />} title="Loading match" detail="Preparing preprocessed journeys and events…" />}
    {props.state === "error" && <Overlay icon={<MapPinned />} title="No match on canvas" detail={props.error ?? "Choose a match from the filter rail."} />}
    {props.state === "ready" && props.match === null && <Overlay icon={<MapPinned />} title="Choose a match" detail="Use the map, date, and match filters to begin." />}
  </section>;
}

function Overlay({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) { return <div className="canvas-overlay"><div>{icon}</div><h2>{title}</h2><p>{detail}</p></div>; }
function formatTime(seconds: number): string { const rounded = Math.max(0, Math.floor(seconds)); return `${Math.floor(rounded / 60).toString().padStart(2, "0")}:${(rounded % 60).toString().padStart(2, "0")}`; }

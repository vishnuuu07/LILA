import { Pause, Play, RotateCcw } from "lucide-react";
import { IconButton } from "./IconButton";

interface PlaybackBarProps { duration: number; time: number; playing: boolean; speed: number; disabled: boolean; onPlay: () => void; onRestart: () => void; onTime: (time: number) => void; onSpeed: (speed: number) => void; }
const formatTime = (seconds: number) => { const safe = Math.max(0, Math.floor(seconds)); return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`; };

export function PlaybackBar({ duration, time, playing, speed, disabled, onPlay, onRestart, onTime, onSpeed }: PlaybackBarProps) {
  return <footer className="playback"><div className="playback-actions"><IconButton label={playing ? "Pause playback" : "Play playback"} disabled={disabled} onClick={onPlay}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</IconButton><IconButton label="Restart playback" disabled={disabled} onClick={onRestart}><RotateCcw size={16} /></IconButton></div><time>{formatTime(time)}</time><input className="timeline" aria-label="Playback timeline" type="range" min="0" max={Math.max(duration, 1)} step="0.1" value={time} disabled={disabled} onChange={(event) => onTime(Number(event.target.value))} /><time>{formatTime(duration)}</time><div className="speed" aria-label="Playback speed">{[0.5, 1, 2, 4].map((value) => <button key={value} type="button" disabled={disabled} className={speed === value ? "active" : ""} onClick={() => onSpeed(value)}>{value}×</button>)}</div></footer>;
}

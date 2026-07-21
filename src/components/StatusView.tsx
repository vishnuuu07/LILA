import { AlertTriangle, DatabaseZap, RefreshCw } from "lucide-react";

interface StatusViewProps { title: string; detail: string; retry?: () => void; }

export function StatusView({ title, detail, retry }: StatusViewProps) {
  return <section className="status-view" role="status"><div className="status-icon">{retry ? <AlertTriangle aria-hidden="true" /> : <DatabaseZap aria-hidden="true" />}</div><h2>{title}</h2><p>{detail}</p>{retry && <button className="button-secondary" type="button" onClick={retry}><RefreshCw size={15} /> Try again</button>}</section>;
}

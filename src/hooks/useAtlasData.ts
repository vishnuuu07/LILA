import { useCallback, useEffect, useMemo, useState } from "react";
import { parseMaps, parseMatch, parseMetadata } from "../data/validation";
import type { AtlasMap, AtlasMetadata, ParsedAtlasMatch } from "../types/atlas";

export type ResourceState = "loading" | "ready" | "error";

async function json(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}.`);
  return response.json() as Promise<unknown>;
}

export interface AtlasDataState {
  state: ResourceState;
  error: string | null;
  metadata: AtlasMetadata | null;
  maps: readonly AtlasMap[];
  match: ParsedAtlasMatch | null;
  matchState: ResourceState;
  matchError: string | null;
  loadMatch: (file: string) => Promise<void>;
  retry: () => void;
}

export function useAtlasData(): AtlasDataState {
  const [state, setState] = useState<ResourceState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AtlasMetadata | null>(null);
  const [maps, setMaps] = useState<readonly AtlasMap[]>([]);
  const [match, setMatch] = useState<ParsedAtlasMatch | null>(null);
  const [matchState, setMatchState] = useState<ResourceState>("loading");
  const [matchError, setMatchError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;
    setState("loading");
    setError(null);
    Promise.all([json("/data/metadata.json"), json("/data/maps.json")])
      .then(([metadataJson, mapsJson]) => {
        if (!active) return;
        setMetadata(parseMetadata(metadataJson));
        setMaps(parseMaps(mapsJson));
        setState("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState("error");
        setError(reason instanceof Error ? reason.message : "ATLAS metadata could not be loaded.");
        setMatchState("error");
      });
    return () => { active = false; };
  }, [refreshToken]);

  const loadMatch = useCallback(async (file: string) => {
    setMatchState("loading");
    setMatchError(null);
    setMatch(null);
    try {
      const result = parseMatch(await json(file));
      setMatch(result);
      setMatchState("ready");
    } catch (reason: unknown) {
      setMatchState("error");
      setMatchError(reason instanceof Error ? reason.message : "This match could not be loaded.");
    }
  }, []);

  return useMemo(() => ({ state, error, metadata, maps, match, matchState, matchError, loadMatch, retry: () => setRefreshToken((token) => token + 1) }), [state, error, metadata, maps, match, matchState, matchError, loadMatch]);
}

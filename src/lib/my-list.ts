/**
 * "My list": saved episode numbers kept only in the visitor's own browser
 * (localStorage). This is the site's only use of browser storage; nothing is
 * sent to the server.
 */
import { useSyncExternalStore } from "react";

export const MY_LIST_KEY = "vettly-my-list";
const MAX_ITEMS = 200;
const EMPTY: number[] = [];

/** Parse saved or shared episode numbers ("21,24,28" or a JSON array), deduped, in order. */
export function parseEpisodeList(raw: unknown): number[] {
  let values: unknown[] = [];
  if (Array.isArray(raw)) values = raw;
  else if (typeof raw === "string") values = raw.split(",");
  else if (typeof raw === "number") values = [raw];
  const out: number[] = [];
  for (const v of values) {
    const s = String(v).trim();
    if (!/^\d{1,9}$/.test(s)) continue;
    const n = Number(s);
    if (!out.includes(n)) out.push(n);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

export function shareListPath(episodes: number[]): string {
  return `/list?items=${episodes.join(",")}`;
}

let cacheRaw: string | null | undefined;
let cacheValue: number[] = EMPTY;
const listeners = new Set<() => void>();

function read(): number[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(MY_LIST_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cacheValue = raw ? parseEpisodeList(JSON.parse(raw)) : EMPTY;
    } catch {
      cacheValue = EMPTY;
    }
  }
  return cacheValue;
}

function write(next: number[]) {
  try {
    window.localStorage.setItem(MY_LIST_KEY, JSON.stringify(next.slice(0, MAX_ITEMS)));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === MY_LIST_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMyList(): number[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Newest saves go first. */
export function toggleSaved(episode: number) {
  const list = read();
  write(list.includes(episode) ? list.filter((e) => e !== episode) : [episode, ...list]);
}

export function removeSaved(episode: number) {
  write(read().filter((e) => e !== episode));
}

export function addAllSaved(episodes: number[]) {
  const list = read();
  write([...episodes.filter((e) => !list.includes(e)), ...list]);
}

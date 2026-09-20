import { config } from "./config.js";

const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

export const TIMETABLE_TTL = 15 * 60 * 1000; // ms
export const CLASSES_TTL = 7 * 24 * 60 * 60 * 1000;

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { "anonymous-school": "ap" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.errorMessage ?? response.statusText;
    throw new Error(`WebUntis ${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}

export function get<T>(path: string, params: Record<string, string>, ttl: number): Promise<T> {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const key = url.href;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;

  const value = fetchJson<T>(url);
  cache.set(key, { expires: Date.now() + ttl, value });
  value.catch(() => cache.delete(key));
  return value;
}

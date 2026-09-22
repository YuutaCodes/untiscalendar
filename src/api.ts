import { config } from "./config.js";
import { createEvents, type EventAttributes } from "ics";

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

interface RawEntry {
  ids: number[];
  duration: { start: string; end: string };
  status: string;
  position1: { current: { displayName: string } }[];
  position2: { current: { displayName: string } }[];
  position3: { current: { displayName: string } }[];
}

interface Lesson {
  id: number;
  start: string;
  end: string;
  subject: string | undefined;
  teacher: string | undefined;
  room: string | undefined;
  cancelled: boolean;
}

export async function getLessons(classId: number, start: string, end: string): Promise<Lesson[]> {
  const data = await get<{ days: { gridEntries: RawEntry[] }[] }>(
    "/timetable/entries",
    {
      resourceType: "CLASS",
      start,
      end,
      resources: String(classId),
    },
    TIMETABLE_TTL,
  );

  const allEntries = data.days.flatMap((day) => day.gridEntries);
  const lessons = allEntries.map((entry) => ({
    id: entry.ids[0],
    start: entry.duration.start,
    end: entry.duration.end,
    subject: entry.position1[0]?.current.displayName,
    teacher: entry.position2[0]?.current.displayName,
    room: entry.position3[0]?.current.displayName,
    cancelled: entry.status !== "REGULAR",
  }));

  return lessons;
}

function toDateArray(iso: string): [number, number, number, number, number] {
  const [date, time] = iso.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return [year, month, day, hour, minute];
}

export function buildIcs(lessons: Lesson[]) {
  const events: EventAttributes[] = lessons.map((lesson) => ({
    uid: `${lesson.id}@untiscalendar`,
    start: toDateArray(lesson.start),
    startInputType: "local",
    startOutputType: "utc",
    end: toDateArray(lesson.end),
    endInputType: "local",
    endOutputType: "utc",
    title: lesson.subject ?? "Lesson",
    location: lesson.room,
    description: lesson.teacher,
    status: lesson.cancelled ? "CANCELLED" : "CONFIRMED",
  }));

  const { error, value } = createEvents(events);
  if (error) throw error;
  return value!;
}


function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}
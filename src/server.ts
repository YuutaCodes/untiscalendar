import express from "express";
import { config } from "./config.js";
import {
  buildIcs,
  classifySemester,
  CLASSES_TTL,
  get,
  getCurrentSchoolYearRange,
  getLessons,
  getSemester2Start,
  matchesFilter,
} from "./api.js";

const app = express();

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toStringArray(value: unknown): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

async function resolveDateRange(
  query: Record<string, unknown>,
): Promise<{ start: string; end: string } | { error: string }> {
  if (query.start === undefined && query.end === undefined) {
    return getCurrentSchoolYearRange();
  }
  if (isValidDate(query.start) && isValidDate(query.end)) {
    return { start: query.start, end: query.end };
  }
  return { error: "start and end must be YYYY-MM-DD" };
}

app.get("/schoolyears", async (req, res) => {
  const [years, appData] = await Promise.all([
    get<{ id: number; name: string; dateRange: { start: string; end: string } }[]>(
      "/schoolyears",
      {},
      CLASSES_TTL,
    ),
    get<{ currentSchoolYear: { id: number } }>("/app/data", {}, CLASSES_TTL),
  ]);

  const schoolYears = years.map((year) => ({
    id: year.id,
    name: year.name,
    start: year.dateRange.start,
    end: year.dateRange.end,
    current: year.id === appData.currentSchoolYear.id,
    semester2Start: getSemester2Start(year.dateRange.start),
  }));

  res.json(schoolYears);
});

app.get("/classes", async (req, res) => {
  const range = await resolveDateRange(req.query);
  if ("error" in range) {
    res.status(400).json({ error: range.error });
    return;
  }

  const data = await get<{ classes: { class: { id: number; displayName: string } }[] }>(
    "/timetable/filter",
    { resourceType: "CLASS", start: range.start, end: range.end },
    CLASSES_TTL,
  );

  const classes = data.classes.map((item) => ({
    id: item.class.id,
    name: item.class.displayName,
  }));

  res.json(classes);
});

app.get("/subjects", async (req, res) => {
  const classParam = req.query.class;
  if (typeof classParam !== "string") {
    res.status(400).json({ error: "class is required" });
    return;
  }
  const classId = Number(classParam);
  if (!Number.isInteger(classId)) {
    res.status(400).json({ error: "class must be a number" });
    return;
  }

  const range = await resolveDateRange(req.query);
  if ("error" in range) {
    res.status(400).json({ error: range.error });
    return;
  }

  const lessons = await getLessons(classId, range.start, range.end);

  const datesBySubject = new Map<string, Set<string>>();
  for (const lesson of lessons) {
    if (lesson.subject === undefined) continue;
    const date = lesson.start.slice(0, 10);
    const dates = datesBySubject.get(lesson.subject) ?? new Set();
    dates.add(date);
    datesBySubject.set(lesson.subject, dates);
  }

  const semester2Start = getSemester2Start(range.start);
  const subjects = [...datesBySubject.entries()]
    .map(([subject, dates]) => ({ subject, semester: classifySemester([...dates], semester2Start) }))
    .sort((a, b) => a.subject.localeCompare(b.subject));

  res.json(subjects);
});

app.get("/lessons", async (req, res) => {
  const classParam = req.query.class;
  if (typeof classParam !== "string") {
    res.status(400).json({ error: "class is required" });
    return;
  }
  const classId = Number(classParam);
  if (!Number.isInteger(classId)) {
    res.status(400).json({ error: "class must be a number" });
    return;
  }

  if (!isValidDate(req.query.start) || !isValidDate(req.query.end)) {
    res.status(400).json({ error: "start and end must be YYYY-MM-DD" });
    return;
  }

  const lessons = await getLessons(classId, req.query.start, req.query.end);
  res.json(lessons);
});

app.get("/calendar", async (req, res) => {
  const classParams = toStringArray(req.query.class);
  if (classParams.length === 0) {
    res.status(400).json({ error: "at least one class is required" });
    return;
  }
  const classIds = classParams.map(Number);
  if (classIds.some((id) => !Number.isInteger(id))) {
    res.status(400).json({ error: "class must be a number" });
    return;
  }

  const range = await resolveDateRange(req.query);
  if ("error" in range) {
    res.status(400).json({ error: range.error });
    return;
  }

  const filterParams = toStringArray(req.query.filter);

  const lessonsPerClass = await Promise.all(
    classIds.map(async (classId, i) => {
      const lessons = await getLessons(classId, range.start, range.end);
      const filters = (filterParams[i] ?? "").split(",").map((value) => value.trim()).filter(Boolean);
      return filters.length > 0 ? lessons.filter((lesson) => matchesFilter(lesson.subject, filters)) : lessons;
    }),
  );

  const ics = buildIcs(lessonsPerClass.flat());
  res.type("text/calendar").send(ics);
});

app.listen(config.port, config.host, () => {
  console.log(`Running on http://${config.host}:${config.port}`);
});

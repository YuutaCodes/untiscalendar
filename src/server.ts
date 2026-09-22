import express from "express";
import { config } from "./config.js";
import { buildIcs, CLASSES_TTL, get, getLessons } from "./api.js";

const app = express();

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

app.get("/classes", async (req, res) => {
  const data = await get<{ classes: { class: { id: number; displayName: string } }[] }>(
    "/timetable/filter",
    {
      resourceType: "CLASS",
      start: "2026-09-21",
      end: "2026-09-27",
    },
    CLASSES_TTL,
  );

  const classes = data.classes.map((item) => ({
    id: item.class.id,
    name: item.class.displayName,
  }));

  res.json(classes);
});

app.get("/calendar", async (req, res) => {
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
  const ics = buildIcs(lessons);
  res.type("text/calendar").send(ics);
});

app.listen(config.port, config.host, () => {
  console.log(`Running on http://${config.host}:${config.port}`);
});

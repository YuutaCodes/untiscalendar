import express from "express";
import { config } from "./config.js";
import { CLASSES_TTL, get } from "./api.js";

const app = express();

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

app.listen(config.port, config.host, () => {
  console.log(`Running on http://${config.host}:${config.port}`);
});
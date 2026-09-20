import { get, CLASSES_TTL } from "./api.js";

console.time("first");
const data = await get<{ currentSchoolYear: { name: string } }>("/app/data", {}, CLASSES_TTL);
console.timeEnd("first");
console.log(data.currentSchoolYear.name);

console.time("second");
await get("/app/data", {}, CLASSES_TTL);
console.timeEnd("second");

for (let i = 0; i < 2; i++) {
  try {
    await get("/timetable/entries", { resourceType: "CLASS" }, CLASSES_TTL);
  } catch (e) {
    console.log((e as Error).message);
  }
}

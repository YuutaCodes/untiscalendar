export interface SchoolClass {
  id: number;
  name: string;
}

export interface SchoolYear {
  id: number;
  name: string;
  start: string;
  end: string;
  current: boolean;
  semester2Start: string | null;
}

export async function fetchSchoolYears(): Promise<SchoolYear[]> {
  const res = await fetch("/schoolyears");
  if (!res.ok) throw new Error(`Failed to load school years: ${res.status}`);
  return res.json();
}

export async function fetchClasses(start: string, end: string): Promise<SchoolClass[]> {
  const res = await fetch(`/classes?start=${start}&end=${end}`);
  if (!res.ok) throw new Error(`Failed to load classes: ${res.status}`);
  return res.json();
}

export type Semester = "1" | "2" | "full";

export interface SubjectInfo {
  subject: string;
  semester: Semester;
}

export async function fetchSubjects(classId: number, start: string, end: string): Promise<SubjectInfo[]> {
  const res = await fetch(`/subjects?class=${classId}&start=${start}&end=${end}`);
  if (!res.ok) throw new Error(`Failed to load subjects: ${res.status}`);
  return res.json();
}

export interface Lesson {
  id: number;
  start: string;
  end: string;
  subject: string | undefined;
  teacher: string | undefined;
  room: string | undefined;
  cancelled: boolean;
}

export async function fetchLessons(classId: number, start: string, end: string): Promise<Lesson[]> {
  const res = await fetch(`/lessons?class=${classId}&start=${start}&end=${end}`);
  if (!res.ok) throw new Error(`Failed to load lessons: ${res.status}`);
  return res.json();
}

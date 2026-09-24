import type { SchoolYear } from "./api";

export interface ClassFilter {
  classId: number;
  allSubjects: string[];
  excluded: Set<string>;
}

export function buildSubscriptionLink(classFilters: ClassFilter[], year: SchoolYear): string {
  const params = new URLSearchParams();

  for (const cf of classFilters) {
    const kept = cf.allSubjects.filter((subject) => !cf.excluded.has(subject));
    if (kept.length === 0) continue;
    params.append("class", String(cf.classId));
    params.append("filter", kept.join(","));
  }

  if (!year.current) {
    params.set("start", year.start);
    params.set("end", year.end);
  }

  return `${window.location.origin}/calendar?${params.toString()}`;
}

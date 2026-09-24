export const SERIES_SLOT_COUNT = 8;

export function colorForSubject(subject: string, allSubjects: string[]): string {
  const index = allSubjects.indexOf(subject);
  const slot = (index < 0 ? 0 : index % SERIES_SLOT_COUNT) + 1;
  return `var(--series-${slot})`;
}

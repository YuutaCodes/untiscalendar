import type { Lesson } from "./api";
import { colorForSubject } from "./colors";
import { addDays } from "./date";
import "./WeekGrid.css";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 22;

interface WeekGridProps {
  lessons: Lesson[];
  allSubjects: string[];
  weekStart: string;
  dayLabels: readonly string[];
  lessonFallback: string;
  today: string;
  noLessonsLabel: string;
}

function nowPercent(): number {
  const now = new Date();
  const minutes = (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes();
  const windowMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  return clamp((minutes / windowMinutes) * 100, 0, 100);
}

function minutesSinceDayStart(iso: string): number {
  const [, time] = iso.split("T");
  const [hour, minute] = time.split(":").map(Number);
  return (hour - DAY_START_HOUR) * 60 + minute;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getEventPosition(lesson: Lesson): { top: string; height: string } {
  const windowMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const startPercent = clamp((minutesSinceDayStart(lesson.start) / windowMinutes) * 100, 0, 100);
  const endPercent = clamp((minutesSinceDayStart(lesson.end) / windowMinutes) * 100, 0, 100);

  return { top: `${startPercent}%`, height: `${Math.max(endPercent - startPercent, 0)}%` };
}

function layoutDay(dayLessons: Lesson[]): Map<Lesson, { column: number; columnCount: number }> {
  const result = new Map<Lesson, { column: number; columnCount: number }>();
  const sorted = [...dayLessons].sort((a, b) => a.start.localeCompare(b.start));

  function layoutCluster(cluster: Lesson[]) {
    const columnEndTimes: string[] = [];
    const columnByLesson = new Map<Lesson, number>();

    for (const lesson of cluster) {
      let column = columnEndTimes.findIndex((end) => end <= lesson.start);
      if (column === -1) {
        column = columnEndTimes.length;
        columnEndTimes.push(lesson.end);
      } else {
        columnEndTimes[column] = lesson.end;
      }
      columnByLesson.set(lesson, column);
    }

    const columnCount = columnEndTimes.length;
    for (const lesson of cluster) {
      result.set(lesson, { column: columnByLesson.get(lesson)!, columnCount });
    }
  }

  let cluster: Lesson[] = [];
  let clusterMaxEnd = "";
  for (const lesson of sorted) {
    if (cluster.length > 0 && lesson.start < clusterMaxEnd) {
      cluster.push(lesson);
      clusterMaxEnd = clusterMaxEnd > lesson.end ? clusterMaxEnd : lesson.end;
    } else {
      if (cluster.length > 0) layoutCluster(cluster);
      cluster = [lesson];
      clusterMaxEnd = lesson.end;
    }
  }
  if (cluster.length > 0) layoutCluster(cluster);

  return result;
}

export function WeekGrid({
  lessons,
  allSubjects,
  weekStart,
  dayLabels,
  lessonFallback,
  today,
  noLessonsLabel,
}: WeekGridProps) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  const dayDates = dayLabels.map((_, i) => addDays(weekStart, i));

  function lessonsForDay(dateStr: string): Lesson[] {
    return lessons.filter((lesson) => lesson.start.startsWith(dateStr));
  }

  return (
    <div className="week-grid" style={{ gridTemplateRows: `32px repeat(${hours.length}, 48px)` }}>
      {lessons.length === 0 && <div className="week-grid__empty">{noLessonsLabel}</div>}
      <div className="week-grid__corner" style={{ gridColumn: 1, gridRow: 1 }} />
      {hours.map((hour, i) => (
        <div key={hour} className="week-grid__hour" style={{ gridColumn: 1, gridRow: i + 2 }}>
          {hour}:00
        </div>
      ))}

      {dayLabels.map((label, dayIndex) => {
        const dateStr = dayDates[dayIndex];
        const [, month, day] = dateStr.split("-");
        const isToday = dateStr === today;
        return (
          <div
            key={`header-${dateStr}`}
            className={`week-grid__day-header${isToday ? " week-grid__day-header--today" : ""}`}
            style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
          >
            {label} {Number(day)}/{Number(month)}
          </div>
        );
      })}

      {dayLabels.map((_, dayIndex) => {
        const dateStr = dayDates[dayIndex];
        const dayLessons = lessonsForDay(dateStr);
        const layout = layoutDay(dayLessons);
        const isToday = dateStr === today;
        return (
          <div
            key={`body-${dateStr}`}
            className={`week-grid__day-body${isToday ? " week-grid__day-body--today" : ""}`}
            style={{ gridColumn: dayIndex + 2, gridRow: `2 / span ${hours.length}` }}
          >
            {hours.map((hour) => (
              <div key={hour} className="week-grid__gridline" />
            ))}
            {isToday && <div className="week-grid__now-line" style={{ top: `${nowPercent()}%` }} />}
            {dayLessons.map((lesson, lessonIndex) => {
              const position = getEventPosition(lesson);
              const slot = layout.get(lesson) ?? { column: 0, columnCount: 1 };
              const widthPercent = 100 / slot.columnCount;
              return (
                <div
                  key={`${dateStr}-${lessonIndex}-${lesson.id}`}
                  className="week-grid__event"
                  style={{
                    top: position.top,
                    height: position.height,
                    left: `${slot.column * widthPercent}%`,
                    width: `${widthPercent}%`,
                    background: colorForSubject(lesson.subject ?? "", allSubjects),
                  }}
                >
                  <span className="week-grid__event-title">{lesson.subject ?? lessonFallback}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

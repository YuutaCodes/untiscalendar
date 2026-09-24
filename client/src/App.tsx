import { useEffect, useState } from "react";
import {
  fetchClasses,
  fetchLessons,
  fetchSchoolYears,
  fetchSubjects,
  type Lesson,
  type SchoolClass,
  type SchoolYear,
  type SubjectInfo,
} from "./api";
import { ClassSelectionCard } from "./ClassSelectionCard";
import { addDays, getCurrentWeekMonday, getWeekMonday, today } from "./date";
import { detectDefaultLang, storeLang, translations, type Lang } from "./i18n";
import { buildSubscriptionLink, type ClassFilter } from "./link";
import { WeekGrid } from "./WeekGrid";
import "./App.css";

type ErrorKey = "loadErrorClasses" | "loadErrorSubjects" | "loadErrorLessons" | "loadErrorSchoolYears";

interface ClassSelection {
  key: string;
  classQuery: string;
  excluded: Set<string>;
}

interface ClassData {
  subjectInfos: SubjectInfo[];
  lessons: Lesson[];
}

function emptySelection(): ClassSelection {
  return { key: crypto.randomUUID(), classQuery: "", excluded: new Set() };
}

function previewWeekStart(year: SchoolYear): string {
  const isUnderway = year.start <= today() && today() <= year.end;
  return isUnderway ? getCurrentWeekMonday() : getWeekMonday(year.start);
}

function classIdFor(selection: ClassSelection, classes: SchoolClass[]): number | null {
  return classes.find((c) => c.name === selection.classQuery)?.id ?? null;
}

function App() {
  const [lang, setLang] = useState<Lang>(() => detectDefaultLang());
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [yearId, setYearId] = useState<number | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selections, setSelections] = useState<ClassSelection[]>([emptySelection()]);
  const [classData, setClassData] = useState<Record<string, ClassData>>({});
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [copied, setCopied] = useState(false);

  const t = translations[lang];
  const year = schoolYears.find((y) => y.id === yearId) ?? null;
  const semester2Start = year?.semester2Start ?? null;

  function changeLang(next: Lang) {
    setLang(next);
    storeLang(next);
  }

  useEffect(() => {
    document.title = t.title;
  }, [t]);

  useEffect(() => {
    fetchSchoolYears()
      .then((years) => {
        setSchoolYears(years);
        setYearId(years.find((y) => y.current)?.id ?? years[0]?.id ?? null);
      })
      .catch(() => setErrorKey("loadErrorSchoolYears"));
  }, []);

  useEffect(() => {
    let ignore = false;
    setSelections([emptySelection()]);
    setClassData({});
    setWeekStart(year !== null ? previewWeekStart(year) : null);
    if (year === null) {
      setClasses([]);
      return;
    }
    fetchClasses(year.start, year.end)
      .then((data) => {
        if (!ignore) setClasses(data);
      })
      .catch(() => {
        if (!ignore) setErrorKey("loadErrorClasses");
      });
    return () => {
      ignore = true;
    };
  }, [year]);

  const classIdsKey = selections.map((s) => classIdFor(s, classes)).join(",");

  useEffect(() => {
    let ignore = false;
    if (year === null) return;

    Promise.all(
      selections.map(async (selection) => {
        const classId = classIdFor(selection, classes);
        if (classId === null) return [selection.key, { subjectInfos: [], lessons: [] }] as const;
        const [subjectInfos, lessons] = await Promise.all([
          fetchSubjects(classId, year.start, year.end),
          weekStart !== null ? fetchLessons(classId, weekStart, addDays(weekStart, 4)) : Promise.resolve([]),
        ]);
        return [selection.key, { subjectInfos, lessons }] as const;
      }),
    )
      .then((results) => {
        if (ignore) return;
        setClassData(Object.fromEntries(results));
      })
      .catch(() => {
        if (!ignore) setErrorKey("loadErrorSubjects");
      });

    return () => {
      ignore = true;
    };
  }, [classIdsKey, year, weekStart]);

  function updateSelectionQuery(key: string, classQuery: string) {
    setSelections((prev) => prev.map((s) => (s.key === key ? { ...s, classQuery, excluded: new Set() } : s)));
  }

  function toggleSelectionSubject(key: string, subject: string) {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const next = new Set(s.excluded);
        if (next.has(subject)) next.delete(subject);
        else next.add(subject);
        return { ...s, excluded: next };
      }),
    );
  }

  function setSelectionExcluded(key: string, subjects: string[], excluded: boolean) {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const next = new Set(s.excluded);
        for (const subject of subjects) {
          if (excluded) next.add(subject);
          else next.delete(subject);
        }
        return { ...s, excluded: next };
      }),
    );
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied; the user can still select and copy the input manually.
    }
  }

  function addSelection() {
    setSelections((prev) => [...prev, emptySelection()]);
  }

  function removeSelection(key: string) {
    setSelections((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
    setClassData((prev) => {
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  }

  const classFilters: ClassFilter[] = selections
    .map((s) => {
      const classId = classIdFor(s, classes);
      const data = classData[s.key];
      if (classId === null || !data) return null;
      return { classId, allSubjects: data.subjectInfos.map((info) => info.subject), excluded: s.excluded };
    })
    .filter((cf): cf is ClassFilter => cf !== null);

  const hasAnyKeptSubject = classFilters.some((cf) => cf.allSubjects.some((subject) => !cf.excluded.has(subject)));
  const link = year !== null && hasAnyKeptSubject ? buildSubscriptionLink(classFilters, year) : null;

  const combinedAllSubjects = [
    ...new Set(selections.flatMap((s) => classData[s.key]?.subjectInfos.map((info) => info.subject) ?? [])),
  ];
  const previewLessons = selections.flatMap((s) => {
    const data = classData[s.key];
    if (!data) return [];
    return data.lessons.filter((lesson) => lesson.subject === undefined || !s.excluded.has(lesson.subject));
  });

  const hasAnyClassSelected = selections.some((s) => classIdFor(s, classes) !== null);

  return (
    <main className="app">
      <div className="header">
        <div>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="lang-switch">
          <button type="button" className={lang === "en" ? "active" : ""} onClick={() => changeLang("en")}>
            EN
          </button>
          <button type="button" className={lang === "nl" ? "active" : ""} onClick={() => changeLang("nl")}>
            NL
          </button>
        </div>
      </div>
      {errorKey && <p className="error">{t[errorKey]}</p>}

      <label className="field">
        {t.schoolYear}
        <select value={yearId ?? ""} onChange={(e) => setYearId(Number(e.target.value))}>
          {schoolYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
              {y.current ? ` ${t.current}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className={`subscribe${link ? "" : " subscribe--empty"}`}>
        <span className="subscribe__label">{t.subscribeLabel}</span>
        {link ? (
          <>
            <div className="subscribe__row">
              <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className={copied ? "subscribe__copy--done" : ""} onClick={copyLink}>
                {copied ? `✓ ${t.copied}` : t.copyLink}
              </button>
            </div>
            <p className="subscribe__hint">{t.subscribeHint}</p>
          </>
        ) : (
          <p className="subscribe__hint">{t.subscribeEmpty}</p>
        )}
      </div>

      <div className="layout">
        <div className="subjects-list">
          {selections.map((selection) => (
            <ClassSelectionCard
              key={selection.key}
              classQuery={selection.classQuery}
              classes={classes}
              subjectInfos={classData[selection.key]?.subjectInfos ?? []}
              excluded={selection.excluded}
              colorAllSubjects={combinedAllSubjects}
              hasValidClass={classIdFor(selection, classes) !== null}
              datalistId={`classes-${selection.key}`}
              t={t}
              canRemove={selections.length > 1}
              onQueryChange={(query) => updateSelectionQuery(selection.key, query)}
              onToggleSubject={(subject) => toggleSelectionSubject(selection.key, subject)}
              onSetExcluded={(subjects, excluded) => setSelectionExcluded(selection.key, subjects, excluded)}
              onRemove={() => removeSelection(selection.key)}
            />
          ))}
          <button type="button" className="add-class" onClick={addSelection}>
            {t.addClass}
          </button>
          {hasAnyClassSelected && <p className="subjects__note">{t.internshipNote}</p>}
        </div>

        {hasAnyClassSelected && weekStart !== null && (
          <div className="calendar">
            <div className="week-nav">
              <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                {t.previousWeek}
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(year !== null ? previewWeekStart(year) : weekStart)}
              >
                {t.thisWeek}
              </button>
              <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                {t.nextWeek}
              </button>
              {semester2Start && (
                <button type="button" onClick={() => setWeekStart(getWeekMonday(semester2Start))}>
                  {t.goToSemester2}
                </button>
              )}
            </div>

            <div className="calendar__scroll">
              <WeekGrid
                lessons={previewLessons}
                allSubjects={combinedAllSubjects}
                weekStart={weekStart}
                dayLabels={t.days}
                lessonFallback={t.lessonFallback}
                today={today()}
                noLessonsLabel={t.noLessonsThisWeek}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;

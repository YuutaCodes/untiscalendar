import type { SchoolClass, Semester, SubjectInfo } from "./api";
import { colorForSubject } from "./colors";
import type { Translations } from "./i18n";

const SEMESTER_ORDER: Semester[] = ["1", "2", "full"];

interface ClassSelectionCardProps {
  classQuery: string;
  classes: SchoolClass[];
  subjectInfos: SubjectInfo[];
  excluded: Set<string>;
  colorAllSubjects: string[];
  hasValidClass: boolean;
  datalistId: string;
  t: Translations;
  canRemove: boolean;
  onQueryChange: (query: string) => void;
  onToggleSubject: (subject: string) => void;
  onSetExcluded: (subjects: string[], excluded: boolean) => void;
  onRemove: () => void;
}

export function ClassSelectionCard({
  classQuery,
  classes,
  subjectInfos,
  excluded,
  colorAllSubjects,
  hasValidClass,
  datalistId,
  t,
  canRemove,
  onQueryChange,
  onToggleSubject,
  onSetExcluded,
  onRemove,
}: ClassSelectionCardProps) {
  const semesterLabels: Record<Semester, string> = {
    "1": t.semester1,
    "2": t.semester2,
    full: t.fullYear,
  };

  const keptCount = subjectInfos.filter((info) => !excluded.has(info.subject)).length;
  const allSubjectNames = subjectInfos.map((info) => info.subject);

  return (
    <div className="subjects">
      <div className="subjects__header">
        <label className="field">
          {t.class}
          <input
            list={datalistId}
            value={classQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t.classPlaceholder}
            autoComplete="off"
            className={!hasValidClass && classQuery.length > 0 ? "field__input--invalid" : ""}
          />
          <datalist id={datalistId}>
            {classes.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </label>
        {canRemove && (
          <button type="button" className="subjects__remove" title={t.removeClass} onClick={onRemove}>
            ×
          </button>
        )}
      </div>

      {!hasValidClass && classQuery.length > 0 && <p className="hint hint--warn">{t.classNotFound}</p>}
      {!hasValidClass && classQuery.length === 0 && <p className="hint">{t.typeClassHint}</p>}
      {hasValidClass && subjectInfos.length === 0 && <p className="hint">{t.loadingLessons}</p>}

      {subjectInfos.length > 0 && (
        <>
          <div className="subjects__bulk">
            <button type="button" className="subjects__bulk-btn" onClick={() => onSetExcluded(allSubjectNames, false)}>
              {t.selectAll}
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" className="subjects__bulk-btn" onClick={() => onSetExcluded(allSubjectNames, true)}>
              {t.selectNone}
            </button>
          </div>
          {SEMESTER_ORDER.map((semester) => {
            const group = subjectInfos.filter((info) => info.semester === semester);
            if (group.length === 0) return null;
            return (
              <fieldset key={semester} className="subjects__group">
                <legend>{semesterLabels[semester]}</legend>
                {group.map(({ subject }) => (
                  <label key={subject} className="subject">
                    <input
                      type="checkbox"
                      checked={!excluded.has(subject)}
                      onChange={() => onToggleSubject(subject)}
                    />
                    <span
                      className="subject__dot"
                      style={{ background: colorForSubject(subject, colorAllSubjects) }}
                      aria-hidden="true"
                    />
                    {subject}
                  </label>
                ))}
              </fieldset>
            );
          })}
          {keptCount === 0 && <p className="hint hint--warn">{t.selectAtLeastOne}</p>}
        </>
      )}
    </div>
  );
}

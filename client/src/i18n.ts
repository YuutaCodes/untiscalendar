export type Lang = "en" | "nl";

const LANG_STORAGE_KEY = "lang";

export interface Translations {
  title: string;
  subtitle: string;
  schoolYear: string;
  current: string;
  class: string;
  classPlaceholder: string;
  lessons: string;
  addClass: string;
  removeClass: string;
  selectAtLeastOne: string;
  copyLink: string;
  copied: string;
  subscribeLabel: string;
  subscribeHint: string;
  subscribeEmpty: string;
  selectAll: string;
  selectNone: string;
  classNotFound: string;
  typeClassHint: string;
  loadingLessons: string;
  noLessonsThisWeek: string;
  semester1: string;
  semester2: string;
  fullYear: string;
  lessonFallback: string;
  days: string[];
  previousWeek: string;
  nextWeek: string;
  thisWeek: string;
  goToSemester2: string;
  internshipNote: string;
  loadErrorClasses: string;
  loadErrorSubjects: string;
  loadErrorLessons: string;
  loadErrorSchoolYears: string;
}

export const translations: Record<Lang, Translations> = {
  en: {
    title: "WebUntis Calendar Subscription",
    subtitle: "Pick your classes and lessons below, then subscribe to the link in your calendar app to keep your schedule in sync automatically.",
    schoolYear: "School year",
    current: "(current)",
    class: "Class",
    classPlaceholder: "Start typing a class name…",
    lessons: "Lessons",
    addClass: "+ Add another class",
    removeClass: "Remove this class",
    selectAtLeastOne: "Select at least one lesson to get a link.",
    copyLink: "Copy link",
    copied: "Copied!",
    subscribeLabel: "Your subscription link",
    subscribeHint: "Paste this into Google Calendar, Apple Calendar or Outlook as a \"subscribe by URL\" calendar.",
    subscribeEmpty: "Select a class and at least one lesson below to generate your link.",
    selectAll: "All",
    selectNone: "None",
    classNotFound: "No class matches that name.",
    typeClassHint: "Type a class name above to see its lessons.",
    loadingLessons: "Loading lessons…",
    noLessonsThisWeek: "No lessons scheduled this week.",
    semester1: "Semester 1",
    semester2: "Semester 2",
    fullYear: "Full year",
    lessonFallback: "Lesson",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    previousWeek: "◀ Previous week",
    nextWeek: "Next week ▶",
    thisWeek: "This week",
    goToSemester2: "Semester 2 ▶",
    internshipNote:
      "Internships and other off-site placements usually only show up as one info session. WebUntis doesn't track the actual placement as scheduled lessons.",
    loadErrorClasses: "Failed to load classes.",
    loadErrorSubjects: "Failed to load lessons.",
    loadErrorLessons: "Failed to load the schedule preview.",
    loadErrorSchoolYears: "Failed to load school years.",
  },
  nl: {
    title: "WebUntis Kalenderabonnement",
    subtitle: "Kies hieronder je klassen en lessen, en abonneer je daarna op de link in je agenda-app om je rooster automatisch synchroon te houden.",
    schoolYear: "Schooljaar",
    current: "(huidig)",
    class: "Klas",
    classPlaceholder: "Begin te typen…",
    lessons: "Lessen",
    addClass: "+ Nog een klas toevoegen",
    removeClass: "Verwijder deze klas",
    selectAtLeastOne: "Selecteer minstens één les om een link te krijgen.",
    copyLink: "Link kopiëren",
    copied: "Gekopieerd!",
    subscribeLabel: "Jouw abonnementslink",
    subscribeHint: "Plak dit in Google Agenda, Apple Agenda of Outlook als een \"agenda abonneren via URL\".",
    subscribeEmpty: "Selecteer hieronder een klas en minstens één les om je link te genereren.",
    selectAll: "Alles",
    selectNone: "Geen",
    classNotFound: "Geen klas gevonden met die naam.",
    typeClassHint: "Typ hierboven een klasnaam om de lessen te zien.",
    loadingLessons: "Lessen laden…",
    noLessonsThisWeek: "Geen lessen deze week.",
    semester1: "Semester 1",
    semester2: "Semester 2",
    fullYear: "Volledig jaar",
    lessonFallback: "Les",
    days: ["Ma", "Di", "Wo", "Do", "Vr"],
    previousWeek: "◀ Vorige week",
    nextWeek: "Volgende week ▶",
    thisWeek: "Deze week",
    goToSemester2: "Semester 2 ▶",
    internshipNote:
      "Stages en externe opdrachten tonen meestal enkel een infosessie. WebUntis houdt de stage zelf niet bij als geplande lessen.",
    loadErrorClasses: "Klassen laden mislukt.",
    loadErrorSubjects: "Lessen laden mislukt.",
    loadErrorLessons: "Lesrooster laden mislukt.",
    loadErrorSchoolYears: "Schooljaren laden mislukt.",
  },
};

export function detectDefaultLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "nl") return stored;
  } catch {}
  return navigator.language.toLowerCase().startsWith("nl") ? "nl" : "en";
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {}
}

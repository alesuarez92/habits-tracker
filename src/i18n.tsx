import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { HabitDraft, HabitKind } from './db';

export type Lang = 'en' | 'es';

type LawField = { key: keyof HabitDraft; label: string; placeholder: string };
type Law = { title: string; fields: LawField[] };

const en = {
  tabs: { today: 'Today', habits: 'Habits', progress: 'Progress', scorecard: 'Scorecard' },
  language: 'Language',
  kind: { build: 'Build', break: 'Break' } as Record<HabitKind, string>,
  days: (n: number): string => (n === 1 ? 'day' : 'days'),

  today: {
    title: 'Today',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    todayCount: (n: number, total: number) => `${n} of ${total} today`,
    identityCaption: (votes: number) => `${votes} votes so far. Each dot is a vote from the last 7 days.`,
    moleculeLabel: (summary: string) => `Identity votes: ${summary}`,
    streak: (n: number): string => (n === 1 ? '1-day streak' : `${n}-day streak`),
    quote: '“You do not rise to the level of your goals. You fall to the level of your systems.”',
    createFirst: 'Create your first habit',
    intention: (name: string, time: string, location: string) =>
      `I will ${name.toLowerCase()}${time ? ` at ${time}` : ''}${location ? ` in ${location}` : ''}.`,
    stack: (s: string) => `After I ${s}.`,
    twoMin: '2-min:',
    cost: 'Cost:',
    avoid: 'Avoid:',
    reward: 'Reward:',
    missedTitle: 'Missed yesterday',
    missedQuote: '“Missing once is an accident. Missing twice is the start of a new habit.”',
    missedHint: (mini: string) => (mini ? `Two minutes counts: ${mini}.` : 'Get back on track today.'),
    breaking: 'Breaking',
    done: 'Done',
    mini: '2-min',
    miniLong: '2-min version',
    missed: 'Missed',
    resisted: 'Resisted',
    slipped: 'Slipped',
  },

  form: {
    newTitle: 'New habit',
    editTitle: 'Edit habit',
    type: 'Habit type',
    buildHabit: 'Build a habit',
    breakHabit: 'Break a habit',
    habit: 'Habit',
    habitPlaceholder: { build: 'Read', break: 'Scroll social media in bed' } as Record<HabitKind, string>,
    identity: 'Identity: who do you want to become?',
    identityPlaceholder: { build: 'I am a reader', break: 'I am someone who protects my sleep' } as Record<HabitKind, string>,
    cancel: 'Cancel',
    save: 'Save habit',
    // The Four Laws of Behavior Change, and their inversions for breaking a habit.
    laws: {
      build: [
        {
          title: '1. Make it obvious',
          fields: [
            { key: 'time', label: 'When', placeholder: '7:00 am' },
            { key: 'location', label: 'Where', placeholder: 'the living room' },
            { key: 'stack', label: 'Habit stack: after I…', placeholder: 'pour my morning coffee' },
          ],
        },
        { title: '2. Make it attractive', fields: [{ key: 'attractive', label: 'Temptation bundle: while or after doing it, I get to…', placeholder: 'listen to my favorite podcast' }] },
        { title: '3. Make it easy', fields: [{ key: 'easy', label: 'Two-minute version', placeholder: 'read one page' }] },
        { title: '4. Make it satisfying', fields: [{ key: 'satisfying', label: 'Immediate reward', placeholder: 'mark it done and watch the streak grow' }] },
      ],
      break: [
        { title: '1. Make it invisible', fields: [{ key: 'cue', label: 'What triggers it, and how will you remove the cue?', placeholder: 'phone on the nightstand → charge it in the kitchen' }] },
        { title: '2. Make it unattractive', fields: [{ key: 'attractive', label: 'What does this habit really cost you?', placeholder: 'I lose an hour of sleep every night' }] },
        { title: '3. Make it difficult', fields: [{ key: 'easy', label: 'What friction will you add?', placeholder: 'log out of the apps after each use' }] },
        { title: '4. Make it unsatisfying', fields: [{ key: 'satisfying', label: 'Accountability partner or consequence', placeholder: 'tell Sam every time I slip' }] },
      ],
    } as Record<HabitKind, Law[]>,
  },

  habits: {
    title: 'Habits',
    new: 'New habit',
    empty: 'No active habits yet. Start small: a habit you can do in two minutes.',
    archived: 'Archived',
    edit: 'Edit',
    archive: 'Archive',
    restore: 'Restore',
    delete: 'Delete',
    confirmDelete: (name: string) => `Delete "${name}" and all its history?`,
    backup: 'Backup',
    backupNote: 'Your data lives only on this device. Export a backup now and then.',
    export: 'Export',
    import: 'Import',
    confirmImport: 'Replace all current data with this backup?',
    restored: 'Backup restored.',
    notBackup: 'This file is not a Habits backup.',
    readError: 'Could not read that file.',
  },

  progress: {
    title: 'Progress',
    empty: 'Your progress will show up here once you start tracking habits.',
    identityVotes: 'Identity votes',
    lastWeeks: (n: number) => `Last ${n} weeks`,
    current: 'Current',
    longest: 'Longest',
    rate30: '30-day',
    votes: 'Votes',
    heatmap: (name: string, n: number) => `${name}: last ${n} weeks`,
    legendDone: 'done',
    legendMini: '2-min',
    legendMissed: 'missed / slipped',
    legendNone: 'not logged',
  },

  scorecard: {
    title: 'Habits Scorecard',
    intro: 'List what you do on a typical day, from waking up to going to bed. Then rate each habit: does it cast a vote for the person you want to become (+), against it (−), or neither (=)?',
    placeholder: 'e.g. Check my phone in bed',
    inputLabel: 'Daily habit',
    add: 'Add',
    good: 'Good',
    neutral: 'Neutral',
    bad: 'Bad',
    rate: (text: string) => `Rate ${text}`,
    breakIt: 'Break it',
    remove: (text: string) => `Remove ${text}`,
  },
};

type Dict = typeof en;

const es: Dict = {
  tabs: { today: 'Hoy', habits: 'Hábitos', progress: 'Progreso', scorecard: 'Tabla' },
  language: 'Idioma',
  kind: { build: 'Crear', break: 'Dejar' },
  days: (n) => (n === 1 ? 'día' : 'días'),

  today: {
    title: 'Hoy',
    prevDay: 'Día anterior',
    nextDay: 'Día siguiente',
    todayCount: (n, total) => `${n} de ${total} hoy`,
    identityCaption: (votes) => `${votes} votos hasta ahora. Cada punto es un voto de los últimos 7 días.`,
    moleculeLabel: (summary) => `Votos de identidad: ${summary}`,
    streak: (n) => (n === 1 ? 'racha de 1 día' : `racha de ${n} días`),
    quote: '“No te elevas al nivel de tus metas. Caes al nivel de tus sistemas.”',
    createFirst: 'Crea tu primer hábito',
    intention: (name, time, location) =>
      `Voy a ${name.toLowerCase()}${time ? ` a las ${time}` : ''}${location ? ` en ${location}` : ''}.`,
    stack: (s) => `Después de ${s}.`,
    twoMin: '2 min:',
    cost: 'Costo:',
    avoid: 'Evita:',
    reward: 'Recompensa:',
    missedTitle: 'Ayer fallaste',
    missedQuote: '“Fallar una vez es un accidente. Fallar dos veces es el comienzo de un nuevo hábito.”',
    missedHint: (mini) => (mini ? `Dos minutos cuentan: ${mini}.` : 'Retoma el camino hoy.'),
    breaking: 'Dejando',
    done: 'Hecho',
    mini: '2 min',
    miniLong: 'Versión de 2 min',
    missed: 'Fallé',
    resisted: 'Resistí',
    slipped: 'Recaí',
  },

  form: {
    newTitle: 'Nuevo hábito',
    editTitle: 'Editar hábito',
    type: 'Tipo de hábito',
    buildHabit: 'Crear un hábito',
    breakHabit: 'Dejar un hábito',
    habit: 'Hábito',
    habitPlaceholder: { build: 'Leer', break: 'Ver redes sociales en la cama' },
    identity: 'Identidad: ¿quién quieres llegar a ser?',
    identityPlaceholder: { build: 'Soy una persona que lee', break: 'Soy alguien que cuida su sueño' },
    cancel: 'Cancelar',
    save: 'Guardar hábito',
    laws: {
      build: [
        {
          title: '1. Hazlo obvio',
          fields: [
            { key: 'time', label: 'Cuándo', placeholder: '7:00 am' },
            { key: 'location', label: 'Dónde', placeholder: 'la sala' },
            { key: 'stack', label: 'Acumulación de hábitos: después de…', placeholder: 'servirme el café de la mañana' },
          ],
        },
        { title: '2. Hazlo atractivo', fields: [{ key: 'attractive', label: 'Agrupación de tentaciones: mientras lo hago o después, me permito…', placeholder: 'escuchar mi podcast favorito' }] },
        { title: '3. Hazlo fácil', fields: [{ key: 'easy', label: 'Versión de dos minutos', placeholder: 'leer una página' }] },
        { title: '4. Hazlo satisfactorio', fields: [{ key: 'satisfying', label: 'Recompensa inmediata', placeholder: 'marcarlo como hecho y ver crecer la racha' }] },
      ],
      break: [
        { title: '1. Hazlo invisible', fields: [{ key: 'cue', label: '¿Qué lo provoca y cómo eliminarás esa señal?', placeholder: 'teléfono en la mesa de noche → cargarlo en la cocina' }] },
        { title: '2. Hazlo poco atractivo', fields: [{ key: 'attractive', label: '¿Qué te cuesta realmente este hábito?', placeholder: 'pierdo una hora de sueño cada noche' }] },
        { title: '3. Hazlo difícil', fields: [{ key: 'easy', label: '¿Qué fricción vas a añadir?', placeholder: 'cerrar sesión en las apps después de usarlas' }] },
        { title: '4. Hazlo insatisfactorio', fields: [{ key: 'satisfying', label: 'Compañero de responsabilidad o consecuencia', placeholder: 'contarle a Sam cada vez que recaiga' }] },
      ],
    },
  },

  habits: {
    title: 'Hábitos',
    new: 'Nuevo hábito',
    empty: 'Aún no tienes hábitos activos. Empieza poco a poco: un hábito que puedas hacer en dos minutos.',
    archived: 'Archivados',
    edit: 'Editar',
    archive: 'Archivar',
    restore: 'Restaurar',
    delete: 'Eliminar',
    confirmDelete: (name) => `¿Eliminar "${name}" y todo su historial?`,
    backup: 'Respaldo',
    backupNote: 'Tus datos solo se guardan en este dispositivo. Exporta un respaldo de vez en cuando.',
    export: 'Exportar',
    import: 'Importar',
    confirmImport: '¿Reemplazar todos los datos actuales con este respaldo?',
    restored: 'Respaldo restaurado.',
    notBackup: 'Este archivo no es un respaldo de Hábitos.',
    readError: 'No se pudo leer el archivo.',
  },

  progress: {
    title: 'Progreso',
    empty: 'Tu progreso aparecerá aquí cuando empieces a registrar hábitos.',
    identityVotes: 'Votos de identidad',
    lastWeeks: (n) => `Últimas ${n} semanas`,
    current: 'Actual',
    longest: 'Máxima',
    rate30: '30 días',
    votes: 'Votos',
    heatmap: (name, n) => `${name}: últimas ${n} semanas`,
    legendDone: 'hecho',
    legendMini: '2 min',
    legendMissed: 'fallé / recaí',
    legendNone: 'sin registro',
  },

  scorecard: {
    title: 'Tabla de hábitos',
    intro: 'Anota lo que haces en un día normal, desde que te levantas hasta que te acuestas. Luego califica cada hábito: ¿es un voto a favor de la persona que quieres ser (+), en contra (−) o ninguno (=)?',
    placeholder: 'p. ej. Revisar el teléfono en la cama',
    inputLabel: 'Hábito diario',
    add: 'Añadir',
    good: 'Bueno',
    neutral: 'Neutral',
    bad: 'Malo',
    rate: (text) => `Calificar ${text}`,
    breakIt: 'Dejarlo',
    remove: (text) => `Quitar ${text}`,
  },
};

const DICTS: Record<Lang, Dict> = { en, es };
const STORAGE_KEY = 'habits-lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    // Storage unavailable: fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void } | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Not persisted; the choice still applies for this session.
    }
  }, [lang]);

  return <LangContext.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useI18n must be used inside LangProvider');
  return ctx;
}

import Dexie, { type EntityTable } from 'dexie';
import { todayKey } from './dates';

export type HabitKind = 'build' | 'break';
/** done = did it (build) / resisted (break); mini = two-minute version; missed = skipped (build) / slipped (break). */
export type Status = 'done' | 'mini' | 'missed';
export type Rating = '+' | '-' | '=';

export interface Habit {
  id: number;
  kind: HabitKind;
  name: string;
  /** Identity this habit votes for, e.g. "I am a reader". */
  identity: string;
  // 1st law: make it obvious / invisible
  time: string;
  location: string;
  stack: string;
  cue: string;
  // 2nd law: make it attractive / unattractive
  attractive: string;
  // 3rd law: make it easy (two-minute version) / difficult (friction)
  easy: string;
  // 4th law: make it satisfying / unsatisfying
  satisfying: string;
  createdAt: string;
  archived: boolean;
}

export interface Entry {
  id: number;
  habitId: number;
  date: string;
  status: Status;
}

export interface ScoreItem {
  id: number;
  text: string;
  rating: Rating;
  createdAt: string;
}

export type HabitDraft = Omit<Habit, 'id' | 'createdAt' | 'archived'>;

export const db = new Dexie('habits-tracker') as Dexie & {
  habits: EntityTable<Habit, 'id'>;
  entries: EntityTable<Entry, 'id'>;
  scorecard: EntityTable<ScoreItem, 'id'>;
};

db.version(1).stores({
  habits: '++id',
  entries: '++id, habitId, date, &[habitId+date]',
  scorecard: '++id',
});

export function emptyDraft(kind: HabitKind = 'build', name = ''): HabitDraft {
  return { kind, name, identity: '', time: '', location: '', stack: '', cue: '', attractive: '', easy: '', satisfying: '' };
}

export async function addHabit(draft: HabitDraft): Promise<void> {
  await db.habits.add({ ...draft, createdAt: todayKey(), archived: false });
}

export async function deleteHabit(id: number): Promise<void> {
  await db.transaction('rw', db.habits, db.entries, async () => {
    await db.entries.where('habitId').equals(id).delete();
    await db.habits.delete(id);
  });
}

/** Set or clear (status = null) the log for a habit on a given day. */
export async function setStatus(habitId: number, date: string, status: Status | null): Promise<void> {
  const existing = await db.entries.where('[habitId+date]').equals([habitId, date]).first();
  if (status === null) {
    if (existing) await db.entries.delete(existing.id);
  } else if (existing) {
    await db.entries.update(existing.id, { status });
  } else {
    await db.entries.add({ habitId, date, status });
  }
}

export const NOT_BACKUP = 'not-a-habits-backup';

interface Backup {
  app: 'habits-tracker';
  version: 1;
  exportedAt: string;
  habits: Habit[];
  entries: Entry[];
  scorecard: ScoreItem[];
}

export async function exportData(): Promise<Backup> {
  const [habits, entries, scorecard] = await Promise.all([db.habits.toArray(), db.entries.toArray(), db.scorecard.toArray()]);
  return { app: 'habits-tracker', version: 1, exportedAt: new Date().toISOString(), habits, entries, scorecard };
}

export async function importData(data: unknown): Promise<void> {
  const backup = data as Partial<Backup>;
  if (backup.app !== 'habits-tracker' || !Array.isArray(backup.habits) || !Array.isArray(backup.entries) || !Array.isArray(backup.scorecard)) {
    throw new Error(NOT_BACKUP);
  }
  await db.transaction('rw', db.habits, db.entries, db.scorecard, async () => {
    await Promise.all([db.habits.clear(), db.entries.clear(), db.scorecard.clear()]);
    await db.habits.bulkAdd(backup.habits!);
    await db.entries.bulkAdd(backup.entries!);
    await db.scorecard.bulkAdd(backup.scorecard!);
  });
}

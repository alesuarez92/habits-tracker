import { addDays, daysBetween } from './dates';
import type { Status } from './db';

export const isSuccess = (s: Status | undefined): boolean => s === 'done' || s === 'mini';

export interface HabitStats {
  /** Consecutive successful days ending today (or yesterday, if today isn't logged yet). */
  current: number;
  longest: number;
  /** Successful days ever: each one is a vote for the habit's identity. */
  votes: number;
  /** Successful days in the last 7 (today included): the particles orbiting a habit's atom. */
  last7: number;
  /** Success rate over the last 30 days (since the habit started), 0–1. */
  rate30: number;
  /** Yesterday was missed and today isn't done yet: "never miss twice". */
  missedYesterday: boolean;
}

export function computeStats(entries: { date: string; status: Status }[], start: string, today: string): HabitStats {
  const byDate = new Map(entries.map((e) => [e.date, e.status]));
  const ok = (d: string) => isSuccess(byDate.get(d));

  let current = 0;
  let day = ok(today) ? today : addDays(today, -1);
  while (day >= start && ok(day)) {
    current++;
    day = addDays(day, -1);
  }

  let longest = 0;
  let run = 0;
  for (let d = start; d <= today; d = addDays(d, 1)) {
    run = ok(d) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  const votes = entries.filter((e) => isSuccess(e.status) && e.date <= today).length;

  const windowStart = [addDays(today, -29), start].sort().at(-1)!;
  const windowDays = Math.max(daysBetween(windowStart, today) + 1, 1);
  let hits = 0;
  for (let d = windowStart; d <= today; d = addDays(d, 1)) if (ok(d)) hits++;

  let last7 = 0;
  for (let i = 0; i < 7; i++) if (ok(addDays(today, -i))) last7++;

  const yesterday = addDays(today, -1);
  const missedYesterday = yesterday >= start && !ok(yesterday) && !ok(today);

  return { current, longest, votes, last7, rate30: hits / windowDays, missedYesterday };
}

export interface HabitRow<H> {
  habit: H;
  stats: HabitStats;
}

export interface IdentitySummary {
  name: string;
  votes: number;
  /** Votes from the last 7 days: the particles orbiting this identity. */
  recent: number;
  votedToday: boolean;
}

/** Stats for each habit, plus the votes they add up to per identity (a habit with no identity stands for itself). */
export function summarize<H extends { id: number; name: string; identity: string; createdAt: string }>(
  habits: H[],
  entries: { habitId: number; date: string; status: Status }[],
  today: string,
): { rows: HabitRow<H>[]; identities: IdentitySummary[] } {
  const rows = habits.map((habit) => ({
    habit,
    stats: computeStats(entries.filter((e) => e.habitId === habit.id), habit.createdAt, today),
  }));
  const byName = new Map<string, IdentitySummary>();
  for (const { habit, stats } of rows) {
    const name = habit.identity.trim() || habit.name;
    const votedToday = entries.some((e) => e.habitId === habit.id && e.date === today && isSuccess(e.status));
    const node = byName.get(name) ?? { name, votes: 0, recent: 0, votedToday: false };
    node.votes += stats.votes;
    node.recent += stats.last7;
    node.votedToday ||= votedToday;
    byName.set(name, node);
  }
  return { rows, identities: [...byName.values()].sort((a, b) => b.votes - a.votes) };
}

import { addDays, daysBetween } from './dates';
import type { Status } from './db';

export const isSuccess = (s: Status | undefined): boolean => s === 'done' || s === 'mini';

export interface HabitStats {
  /** Consecutive successful days ending today (or yesterday, if today isn't logged yet). */
  current: number;
  longest: number;
  /** Successful days ever: each one is a vote for the habit's identity. */
  votes: number;
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

  const yesterday = addDays(today, -1);
  const missedYesterday = yesterday >= start && !ok(yesterday) && !ok(today);

  return { current, longest, votes, rate30: hits / windowDays, missedYesterday };
}

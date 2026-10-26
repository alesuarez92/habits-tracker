import { describe, expect, it } from 'vitest';
import { computeStats } from './stats';
import { addDays, daysBetween } from './dates';
import type { Status } from './db';

const T = '2026-03-10';
const log = (...days: [number, Status][]) => days.map(([offset, status]) => ({ date: addDays(T, offset), status }));

describe('computeStats', () => {
  it('counts the current streak through today', () => {
    const s = computeStats(log([-2, 'done'], [-1, 'mini'], [0, 'done']), addDays(T, -5), T);
    expect(s.current).toBe(3);
    expect(s.votes).toBe(3);
  });

  it('keeps the streak alive while today is still unlogged', () => {
    const s = computeStats(log([-2, 'done'], [-1, 'done']), addDays(T, -5), T);
    expect(s.current).toBe(2);
    expect(s.missedYesterday).toBe(false);
  });

  it('flags "never miss twice" after one missed day', () => {
    const s = computeStats(log([-3, 'done'], [-2, 'done'], [-1, 'missed']), addDays(T, -5), T);
    expect(s.current).toBe(0);
    expect(s.missedYesterday).toBe(true);
    expect(s.longest).toBe(2);
  });

  it('clears the warning once today is done', () => {
    const s = computeStats(log([-1, 'missed'], [0, 'mini']), addDays(T, -5), T);
    expect(s.missedYesterday).toBe(false);
    expect(s.current).toBe(1);
  });

  it('does not warn on the first day of a habit', () => {
    expect(computeStats([], T, T).missedYesterday).toBe(false);
  });

  it('computes the 30-day rate only since the habit started', () => {
    const s = computeStats(log([-3, 'done'], [-1, 'done']), addDays(T, -3), T);
    expect(s.rate30).toBe(0.5);
  });
});

describe('daysBetween', () => {
  it('handles month and DST boundaries', () => {
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
  });
});

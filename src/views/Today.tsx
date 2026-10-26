import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setStatus, type Habit, type Status } from '../db';
import { addDays, formatDay, todayKey } from '../dates';
import { computeStats, isSuccess } from '../stats';

export default function Today({ onAddHabit }: { onAddHabit: () => void }) {
  const today = todayKey();
  const [day, setDay] = useState(today);
  const habits = useLiveQuery(() => db.habits.filter((h) => !h.archived && h.createdAt <= day).toArray(), [day]);
  const entries = useLiveQuery(() => db.entries.toArray(), []);

  if (!habits || !entries) return null;

  const dayEntries = new Map(entries.filter((e) => e.date === day).map((e) => [e.habitId, e.status]));
  const votes = [...dayEntries.values()].filter(isSuccess).length;

  return (
    <>
      <header className="page-head">
        <div className="day-nav">
          <button className="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label="Previous day">‹</button>
          <div>
            <h1>{day === today ? 'Today' : formatDay(day)}</h1>
            {day === today && <p className="muted">{formatDay(day)}</p>}
          </div>
          <button className="icon-btn" onClick={() => setDay(addDays(day, 1))} disabled={day >= today} aria-label="Next day">›</button>
        </div>
        {habits.length > 0 && (
          <p className="votes">
            <strong>{votes}</strong> of {habits.length} votes cast for the person you want to become.
          </p>
        )}
      </header>

      {habits.length === 0 ? (
        <div className="empty">
          <p>“You do not rise to the level of your goals. You fall to the level of your systems.”</p>
          <button className="primary" onClick={onAddHabit}>Create your first habit</button>
        </div>
      ) : (
        <ul className="cards">
          {habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              status={dayEntries.get(h.id)}
              showWarning={day === today}
              stats={computeStats(entries.filter((e) => e.habitId === h.id), h.createdAt, today)}
              onSet={(s) => setStatus(h.id, day, s === dayEntries.get(h.id) ? null : s)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function HabitCard({ habit: h, status, stats, showWarning, onSet }: {
  habit: Habit;
  status: Status | undefined;
  stats: ReturnType<typeof computeStats>;
  showWarning: boolean;
  onSet: (s: Status) => void;
}) {
  const isBuild = h.kind === 'build';
  const intention = isBuild && (h.time || h.location)
    ? `I will ${h.name.toLowerCase()}${h.time ? ` at ${h.time}` : ''}${h.location ? ` in ${h.location}` : ''}.`
    : '';

  return (
    <li className={`card ${status ? `is-${status}` : ''}`}>
      <div className="card-head">
        <div>
          <span className={`tag ${h.kind}`}>{isBuild ? 'Build' : 'Break'}</span>
          <h2>{h.name}</h2>
          {h.identity && <p className="identity">{h.identity}</p>}
        </div>
        <div className="streak" title={`Longest: ${stats.longest} days`}>
          <strong>{stats.current}</strong>
          <span>day{stats.current === 1 ? '' : 's'}</span>
        </div>
      </div>

      {isBuild ? (
        <ul className="hints">
          {intention && <li>{intention}</li>}
          {h.stack && <li>After I {h.stack}.</li>}
          {h.easy && <li><b>2-min:</b> {h.easy}</li>}
        </ul>
      ) : (
        <ul className="hints">
          {h.attractive && <li><b>Cost:</b> {h.attractive}</li>}
          {h.cue && <li><b>Avoid:</b> {h.cue}</li>}
        </ul>
      )}

      {showWarning && stats.missedYesterday && !status && (
        <p className="warning">You missed yesterday. Never miss twice — {isBuild && h.easy ? 'just do the 2-minute version.' : 'get back on track today.'}</p>
      )}

      <div className="actions">
        {isBuild ? (
          <>
            <button className={status === 'done' ? 'on done' : ''} onClick={() => onSet('done')}>✓ Done</button>
            <button className={status === 'mini' ? 'on mini' : ''} onClick={() => onSet('mini')}>2-min</button>
            <button className={status === 'missed' ? 'on missed' : ''} onClick={() => onSet('missed')}>Missed</button>
          </>
        ) : (
          <>
            <button className={status === 'done' ? 'on done' : ''} onClick={() => onSet('done')}>✓ Resisted</button>
            <button className={status === 'missed' ? 'on missed' : ''} onClick={() => onSet('missed')}>Slipped</button>
          </>
        )}
      </div>
      {status && isBuild && h.satisfying && isSuccess(status) && <p className="reward">Reward: {h.satisfying}</p>}
    </li>
  );
}

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setStatus, type Habit, type Status } from '../db';
import { addDays, formatDay, todayKey } from '../dates';
import { computeStats, isSuccess } from '../stats';
import { useI18n } from '../i18n';

export default function Today({ onAddHabit }: { onAddHabit: () => void }) {
  const { lang, t } = useI18n();
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
          <button className="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label={t.today.prevDay}>‹</button>
          <div>
            <h1>{day === today ? t.today.title : formatDay(day, lang)}</h1>
            {day === today && <p className="muted">{formatDay(day, lang)}</p>}
          </div>
          <button className="icon-btn" onClick={() => setDay(addDays(day, 1))} disabled={day >= today} aria-label={t.today.nextDay}>›</button>
        </div>
        {habits.length > 0 && (
          <p className="votes">{t.today.votes(votes, habits.length)}</p>
        )}
      </header>

      {habits.length === 0 ? (
        <div className="empty">
          <p>{t.today.quote}</p>
          <button className="primary" onClick={onAddHabit}>{t.today.createFirst}</button>
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
  const { t } = useI18n();
  const isBuild = h.kind === 'build';
  const intention = isBuild && (h.time || h.location) ? t.today.intention(h.name, h.time, h.location) : '';

  return (
    <li className={`card ${status ? `is-${status}` : ''}`}>
      <div className="card-head">
        <div>
          <span className={`tag ${h.kind}`}>{t.kind[h.kind]}</span>
          <h2>{h.name}</h2>
          {h.identity && <p className="identity">{h.identity}</p>}
        </div>
        <div className="streak" title={t.today.longest(stats.longest)}>
          <strong>{stats.current}</strong>
          <span>{t.days(stats.current)}</span>
        </div>
      </div>

      {isBuild ? (
        <ul className="hints">
          {intention && <li>{intention}</li>}
          {h.stack && <li>{t.today.stack(h.stack)}</li>}
          {h.easy && <li><b>{t.today.twoMin}</b> {h.easy}</li>}
        </ul>
      ) : (
        <ul className="hints">
          {h.attractive && <li><b>{t.today.cost}</b> {h.attractive}</li>}
          {h.cue && <li><b>{t.today.avoid}</b> {h.cue}</li>}
        </ul>
      )}

      {showWarning && stats.missedYesterday && !status && (
        <p className="warning">{t.today.missedYesterday(isBuild && !!h.easy)}</p>
      )}

      <div className="actions">
        {isBuild ? (
          <>
            <button className={status === 'done' ? 'on done' : ''} onClick={() => onSet('done')}>{t.today.done}</button>
            <button className={status === 'mini' ? 'on mini' : ''} onClick={() => onSet('mini')}>{t.today.mini}</button>
            <button className={status === 'missed' ? 'on missed' : ''} onClick={() => onSet('missed')}>{t.today.missed}</button>
          </>
        ) : (
          <>
            <button className={status === 'done' ? 'on done' : ''} onClick={() => onSet('done')}>{t.today.resisted}</button>
            <button className={status === 'missed' ? 'on missed' : ''} onClick={() => onSet('missed')}>{t.today.slipped}</button>
          </>
        )}
      </div>
      {status && isBuild && h.satisfying && isSuccess(status) && <p className="reward">{t.today.reward} {h.satisfying}</p>}
    </li>
  );
}

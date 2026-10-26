import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setStatus, type Habit, type Status } from '../db';
import { addDays, formatDay, todayKey } from '../dates';
import { isSuccess, summarize, type HabitStats } from '../stats';
import { useI18n } from '../i18n';
import { AtomIcon, Icon, Molecule } from '../atoms';
import { PageHead } from '../ui';

export default function Today({ onAddHabit }: { onAddHabit: () => void }) {
  const { lang, t } = useI18n();
  const today = todayKey();
  const [day, setDay] = useState(today);
  const habits = useLiveQuery(() => db.habits.filter((h) => !h.archived).toArray(), []);
  const entries = useLiveQuery(() => db.entries.toArray(), []);

  if (!habits || !entries) return null;

  const { rows, identities } = summarize(habits, entries, today);
  const visible = rows.filter((r) => r.habit.createdAt <= day);
  const dayEntries = new Map(entries.filter((e) => e.date === day).map((e) => [e.habitId, e.status]));
  const doneToday = rows.filter((r) => entries.some((e) => e.habitId === r.habit.id && e.date === today && isSuccess(e.status))).length;
  const totalVotes = identities.reduce((sum, i) => sum + i.votes, 0);

  return (
    <>
      <PageHead title={day === today ? t.today.title : formatDay(day, lang).split(',')[0]}>
        <div className="day-nav">
          <button className="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label={t.today.prevDay}><Icon name="left" size={18} /></button>
          <span>{formatDay(day, lang)}</span>
          <button className="icon-btn" onClick={() => setDay(addDays(day, 1))} disabled={day >= today} aria-label={t.today.nextDay}><Icon name="right" size={18} /></button>
        </div>
      </PageHead>

      {habits.length === 0 ? (
        <div className="empty">
          <AtomIcon kind="build" particles={0} active={false} size={72} />
          <p>{t.today.quote}</p>
          <button className="btn primary" onClick={onAddHabit}>{t.today.createFirst}</button>
        </div>
      ) : (
        <>
          <section className="card identity-card">
            <Molecule identities={identities} label={t.today.moleculeLabel(identities.map((i) => `${i.name} ${i.votes}`).join(', '))} />
            <div className="identity-text">
              <h2>{identities[0].name}</h2>
              <span className="pill">{t.today.todayCount(doneToday, rows.length)}</span>
            </div>
            <p className="muted">{t.today.identityCaption(totalVotes)}</p>
          </section>

          <ul className="stack">
            {visible.map(({ habit, stats }) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                stats={stats}
                status={dayEntries.get(habit.id)}
                showWarning={day === today}
                onSet={(s) => setStatus(habit.id, day, s)}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function HabitCard({ habit: h, status, stats, showWarning, onSet }: {
  habit: Habit;
  status: Status | undefined;
  stats: HabitStats;
  showWarning: boolean;
  onSet: (s: Status | null) => void;
}) {
  const { t } = useI18n();
  const isBuild = h.kind === 'build';
  const streak = stats.current > 0 ? t.today.streak(stats.current) : '';
  const details = (isBuild ? [h.time, h.location, streak] : [h.identity || h.attractive, streak]).filter(Boolean).join(' · ');
  const toggle = (s: Status) => onSet(status === s ? null : s);

  return (
    <li className={`card habit-card ${h.kind}`}>
      <div className="habit-row">
        <AtomIcon kind={h.kind} particles={stats.last7} active={isSuccess(status)} />
        <div className="habit-text">
          {!isBuild && <span className="eyebrow">{t.today.breaking}</span>}
          <h2>{h.name}</h2>
          {details && <p className="muted">{details}</p>}
        </div>
        <div className="habit-actions">
          {isBuild ? (
            status ? (
              <button className={`btn ${status === 'missed' ? 'quiet' : 'primary'}`} aria-pressed="true" onClick={() => onSet(null)}>
                {status !== 'missed' && <Icon name="check" size={16} />}
                {status === 'done' ? t.today.done : status === 'mini' ? t.today.mini : t.today.missed}
              </button>
            ) : (
              <button className="btn outline" aria-pressed="false" onClick={() => toggle('done')}>{t.today.done}</button>
            )
          ) : (
            <>
              {status !== 'missed' && (
                <button className={`btn ${status === 'done' ? 'break-on' : 'break-outline'}`} aria-pressed={status === 'done'} onClick={() => toggle('done')}>
                  {status === 'done' && <Icon name="check" size={16} />}
                  {t.today.resisted}
                </button>
              )}
              {status !== 'done' && (
                <button
                  className={status === 'missed' ? 'btn quiet' : 'icon-btn round'}
                  aria-pressed={status === 'missed'}
                  aria-label={t.today.slipped}
                  onClick={() => toggle('missed')}
                >
                  {status === 'missed' ? t.today.slipped : <Icon name="x" size={16} />}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isBuild && !status && (
        <div className="chips">
          <button className="chip" onClick={() => toggle('mini')}>{t.today.miniLong}</button>
          <button className="chip" onClick={() => toggle('missed')}>{t.today.missed}</button>
        </div>
      )}

      {isBuild && isSuccess(status) && h.satisfying && <p className="reward">{t.today.reward} {h.satisfying}</p>}

      {showWarning && stats.missedYesterday && !status && (
        <div className="nudge">
          <strong>{t.today.missedTitle}</strong>
          <span>{t.today.missedQuote} {t.today.missedHint(isBuild ? h.easy : '')}</span>
        </div>
      )}
    </li>
  );
}

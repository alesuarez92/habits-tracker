import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry, type Habit, type Status } from '../db';
import { addDays, fromKey, todayKey } from '../dates';
import { computeStats } from '../stats';
import { useI18n } from '../i18n';

const WEEKS = 12;

export default function Progress() {
  const { t } = useI18n();
  const habits = useLiveQuery(() => db.habits.filter((h) => !h.archived).toArray(), []);
  const entries = useLiveQuery(() => db.entries.toArray(), []);
  if (!habits || !entries) return null;

  const today = todayKey();
  const rows = habits.map((h) => {
    const own = entries.filter((e) => e.habitId === h.id);
    return { habit: h, entries: own, stats: computeStats(own, h.createdAt, today) };
  });

  // Every successful day is a vote for the identity behind the habit.
  const identities = new Map<string, number>();
  for (const r of rows) {
    const name = r.habit.identity.trim() || r.habit.name;
    identities.set(name, (identities.get(name) ?? 0) + r.stats.votes);
  }

  return (
    <>
      <header className="page-head"><h1>{t.progress.title}</h1></header>

      {rows.length === 0 ? (
        <p className="empty">{t.progress.empty}</p>
      ) : (
        <>
          <h2 className="section">{t.progress.identityVotes}</h2>
          <ul className="identities">
            {[...identities].sort((a, b) => b[1] - a[1]).map(([name, votes]) => (
              <li key={name}><span>{name}</span><strong>{votes}</strong></li>
            ))}
          </ul>

          <h2 className="section">{t.progress.lastWeeks(WEEKS)}</h2>
          <ul className="cards">
            {rows.map(({ habit, entries, stats }) => (
              <li key={habit.id} className="card">
                <div className="card-head">
                  <div>
                    <span className={`tag ${habit.kind}`}>{t.kind[habit.kind]}</span>
                    <h2>{habit.name}</h2>
                  </div>
                </div>
                <dl className="stats">
                  <div><dt>{t.progress.current}</dt><dd>{stats.current}</dd></div>
                  <div><dt>{t.progress.longest}</dt><dd>{stats.longest}</dd></div>
                  <div><dt>{t.progress.rate30}</dt><dd>{Math.round(stats.rate30 * 100)}%</dd></div>
                  <div><dt>{t.progress.votes}</dt><dd>{stats.votes}</dd></div>
                </dl>
                <Heatmap habit={habit} entries={entries} today={today} />
              </li>
            ))}
          </ul>
          <p className="legend">
            <span className="cell done" /> {t.progress.legendDone} <span className="cell mini" /> {t.progress.legendMini}{' '}
            <span className="cell missed" /> {t.progress.legendMissed} <span className="cell" /> {t.progress.legendNone}
          </p>
        </>
      )}
    </>
  );
}

function Heatmap({ habit, entries, today }: { habit: Habit; entries: Entry[]; today: string }) {
  const { t } = useI18n();
  const byDate = new Map<string, Status>(entries.map((e) => [e.date, e.status]));
  // Start on a Sunday so each column is one week.
  const start = addDays(today, -(7 * (WEEKS - 1) + fromKey(today).getDay()));
  const days: string[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) days.push(d);

  return (
    <div className="heatmap" role="img" aria-label={t.progress.heatmap(habit.name, WEEKS)}>
      {days.map((d) => (
        <span key={d} title={d} className={`cell ${byDate.get(d) ?? ''} ${d < habit.createdAt ? 'before' : ''}`} />
      ))}
    </div>
  );
}

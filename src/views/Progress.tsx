import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry, type Habit, type Status } from '../db';
import { addDays, fromKey, todayKey } from '../dates';
import { summarize } from '../stats';
import { useI18n } from '../i18n';
import { AtomIcon, Molecule } from '../atoms';
import { PageHead } from '../ui';

const WEEKS = 12;

export default function Progress() {
  const { t } = useI18n();
  const habits = useLiveQuery(() => db.habits.filter((h) => !h.archived).toArray(), []);
  const entries = useLiveQuery(() => db.entries.toArray(), []);
  if (!habits || !entries) return null;

  const today = todayKey();
  const { rows, identities } = summarize(habits, entries, today);

  return (
    <>
      <PageHead title={t.progress.title} />

      {rows.length === 0 ? (
        <p className="empty">{t.progress.empty}</p>
      ) : (
        <>
          <section className="card identity-card">
            <Molecule identities={identities} label={t.today.moleculeLabel(identities.map((i) => `${i.name} ${i.votes}`).join(', '))} />
            <h2 className="section">{t.progress.identityVotes}</h2>
            <ul className="identities">
              {identities.map((i) => (
                <li key={i.name}><span>{i.name}</span><strong>{i.votes}</strong></li>
              ))}
            </ul>
          </section>

          <h2 className="section">{t.progress.lastWeeks(WEEKS)}</h2>
          <ul className="stack">
            {rows.map(({ habit, stats }) => (
              <li key={habit.id} className={`card habit-card ${habit.kind}`}>
                <div className="habit-row">
                  <AtomIcon kind={habit.kind} particles={stats.last7} active={false} />
                  <div className="habit-text">
                    <span className="eyebrow">{t.kind[habit.kind]}</span>
                    <h2>{habit.name}</h2>
                  </div>
                </div>
                <dl className="stats">
                  <div><dt>{t.progress.current}</dt><dd>{stats.current}</dd></div>
                  <div><dt>{t.progress.longest}</dt><dd>{stats.longest}</dd></div>
                  <div><dt>{t.progress.rate30}</dt><dd>{Math.round(stats.rate30 * 100)}%</dd></div>
                  <div><dt>{t.progress.votes}</dt><dd>{stats.votes}</dd></div>
                </dl>
                <DotGrid habit={habit} entries={entries.filter((e) => e.habitId === habit.id)} today={today} />
              </li>
            ))}
          </ul>
          <p className="legend">
            <span className="dot done" /> {t.progress.legendDone}
            <span className="dot mini" /> {t.progress.legendMini}
            <span className="dot missed" /> {t.progress.legendMissed}
            <span className="dot" /> {t.progress.legendNone}
          </p>
        </>
      )}
    </>
  );
}

function DotGrid({ habit, entries, today }: { habit: Habit; entries: Entry[]; today: string }) {
  const { t } = useI18n();
  const byDate = new Map<string, Status>(entries.map((e) => [e.date, e.status]));
  // Start on a Sunday so each column is one week.
  const start = addDays(today, -(7 * (WEEKS - 1) + fromKey(today).getDay()));
  const days: string[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) days.push(d);

  return (
    <div className="dot-grid" role="img" aria-label={t.progress.heatmap(habit.name, WEEKS)}>
      {days.map((d) => (
        <span key={d} title={d} className={`dot ${byDate.get(d) ?? ''}${d < habit.createdAt ? ' before' : ''}${d === today ? ' today' : ''}`} />
      ))}
    </div>
  );
}

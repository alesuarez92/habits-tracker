import { useEffect, useState } from 'react';
import type { HabitDraft } from './db';
import Today from './views/Today';
import Habits from './views/Habits';
import Progress from './views/Progress';
import Scorecard from './views/Scorecard';

const TABS = [
  { id: 'today', label: 'Today', icon: '◉' },
  { id: 'habits', label: 'Habits', icon: '☰' },
  { id: 'progress', label: 'Progress', icon: '▦' },
  { id: 'scorecard', label: 'Scorecard', icon: '±' },
] as const;

type Tab = (typeof TABS)[number]['id'];

function tabFromHash(): Tab {
  const id = location.hash.slice(1);
  return TABS.some((t) => t.id === id) ? (id as Tab) : 'today';
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  // A habit pre-filled from elsewhere (e.g. the scorecard), opened in the Habits form.
  const [draft, setDraft] = useState<HabitDraft | null>(null);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (t: Tab) => {
    location.hash = t;
    setTab(t);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <main className="page">
        {tab === 'today' && <Today onAddHabit={() => go('habits')} />}
        {tab === 'habits' && <Habits draft={draft} clearDraft={() => setDraft(null)} />}
        {tab === 'progress' && <Progress />}
        {tab === 'scorecard' &&
          <Scorecard
            onCreateHabit={(d) => {
              setDraft(d);
              go('habits');
            }}
          />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => go(t.id)} aria-current={t.id === tab ? 'page' : undefined}>
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}

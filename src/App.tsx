import { useEffect, useState } from 'react';
import type { HabitDraft } from './db';
import { useI18n } from './i18n';
import { Icon } from './atoms';
import Today from './views/Today';
import Habits from './views/Habits';
import Progress from './views/Progress';
import Scorecard from './views/Scorecard';

const TABS = ['today', 'habits', 'progress', 'scorecard'] as const;

type Tab = (typeof TABS)[number];

function tabFromHash(): Tab {
  const id = location.hash.slice(1);
  return (TABS as readonly string[]).includes(id) ? (id as Tab) : 'today';
}

export default function App() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  // A habit pre-filled from elsewhere (e.g. the scorecard), opened in the Habits form.
  const [draft, setDraft] = useState<HabitDraft | null>(null);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (next: Tab) => {
    location.hash = next;
    setTab(next);
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
        {TABS.map((id) => (
          <button key={id} className={id === tab ? 'active' : ''} onClick={() => go(id)} aria-label={t.tabs[id]} aria-current={id === tab ? 'page' : undefined}>
            <Icon name={id} size={20} />
            {id === tab && <span>{t.tabs[id]}</span>}
          </button>
        ))}
      </nav>
    </>
  );
}

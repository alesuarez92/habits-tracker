import { useEffect, useState } from 'react';
import type { HabitDraft } from './db';
import { useI18n } from './i18n';
import Today from './views/Today';
import Habits from './views/Habits';
import Progress from './views/Progress';
import Scorecard from './views/Scorecard';

const TABS = [
  { id: 'today', icon: '◉' },
  { id: 'habits', icon: '☰' },
  { id: 'progress', icon: '▦' },
  { id: 'scorecard', icon: '±' },
] as const;

type Tab = (typeof TABS)[number]['id'];

function tabFromHash(): Tab {
  const id = location.hash.slice(1);
  return TABS.some((t) => t.id === id) ? (id as Tab) : 'today';
}

export default function App() {
  const { lang, setLang, t } = useI18n();
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
        <div className="lang-switch segmented small" role="radiogroup" aria-label={t.language}>
          {(['en', 'es'] as const).map((l) => (
            <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
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
        {TABS.map((item) => (
          <button key={item.id} className={item.id === tab ? 'active' : ''} onClick={() => go(item.id)} aria-current={item.id === tab ? 'page' : undefined}>
            <span aria-hidden="true">{item.icon}</span>
            {t.tabs[item.id]}
          </button>
        ))}
      </nav>
    </>
  );
}

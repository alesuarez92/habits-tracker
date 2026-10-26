import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, emptyDraft, type HabitDraft, type Rating } from '../db';
import { todayKey } from '../dates';
import { useI18n } from '../i18n';

const RATINGS: { value: Rating; key: 'good' | 'neutral' | 'bad' }[] = [
  { value: '+', key: 'good' },
  { value: '=', key: 'neutral' },
  { value: '-', key: 'bad' },
];

export default function Scorecard({ onCreateHabit }: { onCreateHabit: (d: HabitDraft) => void }) {
  const { t } = useI18n();
  const items = useLiveQuery(() => db.scorecard.toArray(), []);
  const [text, setText] = useState('');

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    await db.scorecard.add({ text: value, rating: '=', createdAt: todayKey() });
  };

  if (!items) return null;

  return (
    <>
      <header className="page-head">
        <h1>{t.scorecard.title}</h1>
        <p className="muted">{t.scorecard.intro}</p>
      </header>

      <form className="add-row" onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t.scorecard.placeholder} aria-label={t.scorecard.inputLabel} />
        <button type="submit" className="primary">{t.scorecard.add}</button>
      </form>

      <ol className="list scorecard">
        {items.map((item) => (
          <li key={item.id}>
            <span className={`score r${item.rating === '+' ? 'good' : item.rating === '-' ? 'bad' : 'neutral'}`}>{item.text}</span>
            <div className="row-actions">
              <div className="segmented small" role="radiogroup" aria-label={t.scorecard.rate(item.text)}>
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    role="radio"
                    aria-checked={item.rating === r.value}
                    aria-label={t.scorecard[r.key]}
                    className={item.rating === r.value ? `on r${r.key}` : ''}
                    onClick={() => db.scorecard.update(item.id, { rating: r.value })}
                  >
                    {r.value === '-' ? '−' : r.value}
                  </button>
                ))}
              </div>
              {item.rating === '-' && <button onClick={() => onCreateHabit(emptyDraft('break', item.text))}>{t.scorecard.breakIt}</button>}
              <button className="danger" aria-label={t.scorecard.remove(item.text)} onClick={() => db.scorecard.delete(item.id)}>✕</button>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

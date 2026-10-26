import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, emptyDraft, type HabitDraft, type Rating } from '../db';
import { todayKey } from '../dates';

const RATINGS: { value: Rating; label: string }[] = [
  { value: '+', label: 'Good' },
  { value: '=', label: 'Neutral' },
  { value: '-', label: 'Bad' },
];

export default function Scorecard({ onCreateHabit }: { onCreateHabit: (d: HabitDraft) => void }) {
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
        <h1>Habits Scorecard</h1>
        <p className="muted">
          List what you do on a typical day, from waking up to going to bed. Then rate each habit:
          does it cast a vote for the person you want to become (+), against it (−), or neither (=)?
        </p>
      </header>

      <form className="add-row" onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Check my phone in bed" aria-label="Daily habit" />
        <button type="submit" className="primary">Add</button>
      </form>

      <ol className="list scorecard">
        {items.map((item) => (
          <li key={item.id}>
            <span className={`score r${item.rating === '+' ? 'good' : item.rating === '-' ? 'bad' : 'neutral'}`}>{item.text}</span>
            <div className="row-actions">
              <div className="segmented small" role="radiogroup" aria-label={`Rate ${item.text}`}>
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    role="radio"
                    aria-checked={item.rating === r.value}
                    aria-label={r.label}
                    className={item.rating === r.value ? `on r${r.label.toLowerCase()}` : ''}
                    onClick={() => db.scorecard.update(item.id, { rating: r.value })}
                  >
                    {r.value === '-' ? '−' : r.value}
                  </button>
                ))}
              </div>
              {item.rating === '-' && <button onClick={() => onCreateHabit(emptyDraft('break', item.text))}>Break it</button>}
              <button className="danger" aria-label={`Remove ${item.text}`} onClick={() => db.scorecard.delete(item.id)}>✕</button>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

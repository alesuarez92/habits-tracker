import { useState, type FormEvent } from 'react';
import type { HabitDraft, HabitKind } from '../db';

type Field = { key: keyof HabitDraft; label: string; placeholder: string };

// The Four Laws of Behavior Change, and their inversions for breaking a habit.
const LAWS: Record<HabitKind, { title: string; fields: Field[] }[]> = {
  build: [
    {
      title: '1. Make it obvious',
      fields: [
        { key: 'time', label: 'When', placeholder: '7:00 am' },
        { key: 'location', label: 'Where', placeholder: 'the living room' },
        { key: 'stack', label: 'Habit stack: after I…', placeholder: 'pour my morning coffee' },
      ],
    },
    {
      title: '2. Make it attractive',
      fields: [{ key: 'attractive', label: 'Temptation bundle: while or after doing it, I get to…', placeholder: 'listen to my favorite podcast' }],
    },
    {
      title: '3. Make it easy',
      fields: [{ key: 'easy', label: 'Two-minute version', placeholder: 'read one page' }],
    },
    {
      title: '4. Make it satisfying',
      fields: [{ key: 'satisfying', label: 'Immediate reward', placeholder: 'mark it done and watch the streak grow' }],
    },
  ],
  break: [
    {
      title: '1. Make it invisible',
      fields: [{ key: 'cue', label: 'What triggers it, and how will you remove the cue?', placeholder: 'phone on the nightstand → charge it in the kitchen' }],
    },
    {
      title: '2. Make it unattractive',
      fields: [{ key: 'attractive', label: 'What does this habit really cost you?', placeholder: 'I lose an hour of sleep every night' }],
    },
    {
      title: '3. Make it difficult',
      fields: [{ key: 'easy', label: 'What friction will you add?', placeholder: 'log out of the apps after each use' }],
    },
    {
      title: '4. Make it unsatisfying',
      fields: [{ key: 'satisfying', label: 'Accountability partner or consequence', placeholder: 'tell Sam every time I slip' }],
    },
  ],
};

export default function HabitForm({ initial, onSave, onCancel }: {
  initial: HabitDraft;
  onSave: (d: HabitDraft) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState(initial);
  const set = (key: keyof HabitDraft, value: string) => setD({ ...d, [key]: value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (d.name.trim()) onSave({ ...d, name: d.name.trim() });
  };

  return (
    <form className="habit-form" onSubmit={submit}>
      <div className="segmented" role="radiogroup" aria-label="Habit type">
        <button type="button" role="radio" aria-checked={d.kind === 'build'} className={d.kind === 'build' ? 'on' : ''} onClick={() => set('kind', 'build')}>Build a habit</button>
        <button type="button" role="radio" aria-checked={d.kind === 'break'} className={d.kind === 'break' ? 'on' : ''} onClick={() => set('kind', 'break')}>Break a habit</button>
      </div>

      <label>
        Habit
        <input required autoFocus value={d.name} onChange={(e) => set('name', e.target.value)} placeholder={d.kind === 'build' ? 'Read' : 'Scroll social media in bed'} />
      </label>
      <label>
        Identity: who do you want to become?
        <input value={d.identity} onChange={(e) => set('identity', e.target.value)} placeholder={d.kind === 'build' ? 'I am a reader' : 'I am someone who protects my sleep'} />
      </label>

      {LAWS[d.kind].map((law) => (
        <fieldset key={law.title}>
          <legend>{law.title}</legend>
          {law.fields.map((f) => (
            <label key={f.key}>
              {f.label}
              <input value={d[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
            </label>
          ))}
        </fieldset>
      ))}

      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">Save habit</button>
      </div>
    </form>
  );
}

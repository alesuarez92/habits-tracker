import { useState, type FormEvent } from 'react';
import type { HabitDraft } from '../db';
import { useI18n } from '../i18n';

export default function HabitForm({ initial, onSave, onCancel }: {
  initial: HabitDraft;
  onSave: (d: HabitDraft) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [d, setD] = useState(initial);
  const set = (key: keyof HabitDraft, value: string) => setD({ ...d, [key]: value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (d.name.trim()) onSave({ ...d, name: d.name.trim() });
  };

  return (
    <form className="habit-form" onSubmit={submit}>
      <div className="segmented" role="radiogroup" aria-label={t.form.type}>
        <button type="button" role="radio" aria-checked={d.kind === 'build'} className={d.kind === 'build' ? 'on' : ''} onClick={() => set('kind', 'build')}>{t.form.buildHabit}</button>
        <button type="button" role="radio" aria-checked={d.kind === 'break'} className={d.kind === 'break' ? 'on' : ''} onClick={() => set('kind', 'break')}>{t.form.breakHabit}</button>
      </div>

      <label>
        {t.form.habit}
        <input required autoFocus value={d.name} onChange={(e) => set('name', e.target.value)} placeholder={t.form.habitPlaceholder[d.kind]} />
      </label>
      <label>
        {t.form.identity}
        <input value={d.identity} onChange={(e) => set('identity', e.target.value)} placeholder={t.form.identityPlaceholder[d.kind]} />
      </label>

      {t.form.laws[d.kind].map((law) => (
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
        <button type="button" onClick={onCancel}>{t.form.cancel}</button>
        <button type="submit" className="primary">{t.form.save}</button>
      </div>
    </form>
  );
}

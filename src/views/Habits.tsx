import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addHabit, db, deleteHabit, emptyDraft, exportData, importData, NOT_BACKUP, type Habit, type HabitDraft } from '../db';
import { useI18n } from '../i18n';
import { todayKey } from '../dates';
import { summarize, type HabitStats } from '../stats';
import { AtomIcon, Icon } from '../atoms';
import { PageHead } from '../ui';
import HabitForm from './HabitForm';

export default function Habits({ draft, clearDraft }: { draft: HabitDraft | null; clearDraft: () => void }) {
  const { t } = useI18n();
  const habits = useLiveQuery(() => db.habits.toArray(), []);
  const entries = useLiveQuery(() => db.entries.toArray(), []);
  const [editing, setEditing] = useState<Habit | 'new' | null>(draft ? 'new' : null);

  const close = () => {
    setEditing(null);
    clearDraft();
    window.scrollTo(0, 0);
  };

  if (editing) {
    const initial = editing === 'new' ? (draft ?? emptyDraft()) : editing;
    return (
      <>
        <PageHead title={editing === 'new' ? t.form.newTitle : t.form.editTitle} />
        <HabitForm
          initial={initial}
          onCancel={close}
          onSave={async (d) => {
            if (editing === 'new') await addHabit(d);
            else await db.habits.update(editing.id, d);
            close();
          }}
        />
      </>
    );
  }

  if (!habits || !entries) return null;
  const stats = new Map(summarize(habits, entries, todayKey()).rows.map((r) => [r.habit.id, r.stats]));
  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);

  return (
    <>
      <PageHead title={t.habits.title} />
      <button className="new-habit" onClick={() => setEditing('new')}>
        <Icon name="plus" size={20} />
        {t.habits.new}
      </button>

      {active.length === 0 && <p className="empty">{t.habits.empty}</p>}
      <HabitList habits={active} stats={stats} onEdit={setEditing} />

      {archived.length > 0 && (
        <>
          <h2 className="section">{t.habits.archived}</h2>
          <HabitList habits={archived} stats={stats} onEdit={setEditing} />
        </>
      )}

      <Backup />
    </>
  );
}

function HabitList({ habits, stats, onEdit }: { habits: Habit[]; stats: Map<number, HabitStats>; onEdit: (h: Habit) => void }) {
  const { t } = useI18n();
  return (
    <ul className="stack">
      {habits.map((h) => (
        <li key={h.id} className={`card habit-card ${h.kind}${h.archived ? ' archived' : ''}`}>
          <div className="habit-row">
            <AtomIcon kind={h.kind} particles={stats.get(h.id)?.last7 ?? 0} active={false} />
            <div className="habit-text">
              <span className="eyebrow">{t.kind[h.kind]}</span>
              <h2>{h.name}</h2>
              {h.identity && <p className="muted">{h.identity}</p>}
            </div>
          </div>
          <div className="chips">
            <button className="chip" onClick={() => onEdit(h)}>{t.habits.edit}</button>
            <button className="chip" onClick={() => db.habits.update(h.id, { archived: !h.archived })}>{h.archived ? t.habits.restore : t.habits.archive}</button>
            {h.archived && (
              <button className="chip danger" onClick={() => confirm(t.habits.confirmDelete(h.name)) && deleteHabit(h.id)}>{t.habits.delete}</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Backup() {
  const { t } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);

  const download = async () => {
    const blob = new Blob([JSON.stringify(await exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `habits-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const restore = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !confirm(t.habits.confirmImport)) return;
    try {
      await importData(JSON.parse(await file.text()));
      alert(t.habits.restored);
    } catch (err) {
      alert(err instanceof Error && err.message === NOT_BACKUP ? t.habits.notBackup : t.habits.readError);
    }
  };

  return (
    <section className="card backup">
      <h2>{t.habits.backup}</h2>
      <p className="muted">{t.habits.backupNote}</p>
      <div className="chips">
        <button className="chip" onClick={download}>{t.habits.export}</button>
        <button className="chip" onClick={() => fileInput.current?.click()}>{t.habits.import}</button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={restore} />
      </div>
    </section>
  );
}

import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addHabit, db, deleteHabit, emptyDraft, exportData, importData, NOT_BACKUP, type Habit, type HabitDraft } from '../db';
import { useI18n } from '../i18n';
import { todayKey } from '../dates';
import HabitForm from './HabitForm';

export default function Habits({ draft, clearDraft }: { draft: HabitDraft | null; clearDraft: () => void }) {
  const { t } = useI18n();
  const habits = useLiveQuery(() => db.habits.toArray(), []);
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
        <header className="page-head"><h1>{editing === 'new' ? t.form.newTitle : t.form.editTitle}</h1></header>
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

  if (!habits) return null;
  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);

  return (
    <>
      <header className="page-head row">
        <h1>{t.habits.title}</h1>
        <button className="primary" onClick={() => setEditing('new')}>{t.habits.new}</button>
      </header>

      {active.length === 0 && <p className="empty">{t.habits.empty}</p>}
      <HabitList habits={active} onEdit={setEditing} />

      {archived.length > 0 && (
        <>
          <h2 className="section">{t.habits.archived}</h2>
          <HabitList habits={archived} onEdit={setEditing} />
        </>
      )}

      <Backup />
    </>
  );
}

function HabitList({ habits, onEdit }: { habits: Habit[]; onEdit: (h: Habit) => void }) {
  const { t } = useI18n();
  return (
    <ul className="list">
      {habits.map((h) => (
        <li key={h.id}>
          <div>
            <span className={`tag ${h.kind}`}>{t.kind[h.kind]}</span>
            <strong>{h.name}</strong>
            {h.identity && <p className="identity">{h.identity}</p>}
          </div>
          <div className="row-actions">
            <button onClick={() => onEdit(h)}>{t.habits.edit}</button>
            <button onClick={() => db.habits.update(h.id, { archived: !h.archived })}>{h.archived ? t.habits.restore : t.habits.archive}</button>
            {h.archived && (
              <button className="danger" onClick={() => confirm(t.habits.confirmDelete(h.name)) && deleteHabit(h.id)}>{t.habits.delete}</button>
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
    <section className="backup">
      <h2 className="section">{t.habits.backup}</h2>
      <p className="muted">{t.habits.backupNote}</p>
      <div className="row-actions">
        <button onClick={download}>{t.habits.export}</button>
        <button onClick={() => fileInput.current?.click()}>{t.habits.import}</button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={restore} />
      </div>
    </section>
  );
}

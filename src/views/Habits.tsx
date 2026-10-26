import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addHabit, db, deleteHabit, emptyDraft, exportData, importData, type Habit, type HabitDraft } from '../db';
import { todayKey } from '../dates';
import HabitForm from './HabitForm';

export default function Habits({ draft, clearDraft }: { draft: HabitDraft | null; clearDraft: () => void }) {
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
        <header className="page-head"><h1>{editing === 'new' ? 'New habit' : 'Edit habit'}</h1></header>
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
        <h1>Habits</h1>
        <button className="primary" onClick={() => setEditing('new')}>+ New</button>
      </header>

      {active.length === 0 && <p className="empty">No active habits yet. Start small: a habit you can do in two minutes.</p>}
      <HabitList habits={active} onEdit={setEditing} />

      {archived.length > 0 && (
        <>
          <h2 className="section">Archived</h2>
          <HabitList habits={archived} onEdit={setEditing} />
        </>
      )}

      <Backup />
    </>
  );
}

function HabitList({ habits, onEdit }: { habits: Habit[]; onEdit: (h: Habit) => void }) {
  return (
    <ul className="list">
      {habits.map((h) => (
        <li key={h.id}>
          <div>
            <span className={`tag ${h.kind}`}>{h.kind === 'build' ? 'Build' : 'Break'}</span>
            <strong>{h.name}</strong>
            {h.identity && <p className="identity">{h.identity}</p>}
          </div>
          <div className="row-actions">
            <button onClick={() => onEdit(h)}>Edit</button>
            <button onClick={() => db.habits.update(h.id, { archived: !h.archived })}>{h.archived ? 'Restore' : 'Archive'}</button>
            {h.archived && (
              <button className="danger" onClick={() => confirm(`Delete "${h.name}" and all its history?`) && deleteHabit(h.id)}>Delete</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Backup() {
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
    if (!file || !confirm('Replace all current data with this backup?')) return;
    try {
      await importData(JSON.parse(await file.text()));
      alert('Backup restored.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not read that file.');
    }
  };

  return (
    <section className="backup">
      <h2 className="section">Backup</h2>
      <p className="muted">Your data lives only on this device. Export a backup now and then.</p>
      <div className="row-actions">
        <button onClick={download}>Export</button>
        <button onClick={() => fileInput.current?.click()}>Import</button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={restore} />
      </div>
    </section>
  );
}

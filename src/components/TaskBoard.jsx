import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTracker } from '../context/TrackerContext';
import { COLUMNS, PRIORITIES, sortTasks } from '../utils/tracker';
import { DeadlineChip, PriorityBadge } from './Badges';

const ORDER = COLUMNS.map((c) => c.key);

/** Kanban board for one developer: To Do → In Progress → Completed.
 *  Tasks can be dragged between columns or moved with the arrow buttons. */
export default function TaskBoard({ userId, userName, projects = [], canEdit }) {
  const { tasksFor, addTask, moveTask, removeTask } = useTracker();
  const [form, setForm] = useState({ title: '', priority: 'Medium', deadline: '', projectId: '' });
  const [overCol, setOverCol] = useState(null);
  const mine = tasksFor(userId);
  const projectOf = (id) => projects.find((p) => p.id === id);

  const submit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (title.length < 3) return toast.error('Task title needs at least 3 characters');
    addTask({ ...form, title, userId });
    toast.success(`Task added for ${userName}`);
    return setForm((f) => ({ ...f, title: '', deadline: '' }));
  };

  const move = (task, dir) => {
    const next = ORDER[ORDER.indexOf(task.status) + dir];
    if (!next) return;
    moveTask(task.id, next);
    toast.success(next === 'done' ? 'Task completed 🎉' : `Moved to ${COLUMNS.find((c) => c.key === next).label}`);
  };

  const drop = (e, col) => {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData('text/plain');
    const task = mine.find((t) => t.id === id);
    if (task && task.status !== col) {
      moveTask(id, col);
      toast.success(col === 'done' ? 'Task completed 🎉' : `Moved to ${COLUMNS.find((c) => c.key === col).label}`);
    }
  };

  return (
    <section>
      {canEdit ? (
        <form className="card task-form" onSubmit={submit}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New task for this developer…" maxLength={90} aria-label="Task title" />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} aria-label="Priority">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
          </select>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} aria-label="Deadline" />
          <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} aria-label="Project">
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button className="btn btn-primary" type="submit">＋ Add task</button>
        </form>
      ) : (
        <p className="muted small readonly-note">🔒 View only — <Link className="link" to="/login" state={{ from: { pathname: window.location.pathname } }}>sign in as a manager</Link> to add or move tasks.</p>
      )}

      <div className="board">
        {COLUMNS.map((col) => {
          const items = sortTasks(mine.filter((t) => t.status === col.key));
          return (
            <div key={col.key} className={`column ${overCol === col.key ? 'over' : ''}`}
              onDragOver={(e) => { if (canEdit) { e.preventDefault(); setOverCol(col.key); } }}
              onDragLeave={() => setOverCol(null)} onDrop={(e) => canEdit && drop(e, col.key)}>
              <header><h3>{col.label}</h3><span className="count">{items.length}</span></header>
              {items.map((t) => {
                const project = projectOf(t.projectId);
                return (
                  <article key={t.id} className={`task ${t.status === 'done' ? 'is-done' : ''}`} draggable={canEdit} onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}>
                    <p className="task-title">{t.title}</p>
                    <div className="tags"><PriorityBadge priority={t.priority} /><DeadlineChip deadline={t.deadline} done={t.status === 'done'} /></div>
                    {project && <Link to={`/projects/${project.id}`} className="task-project">{project.icon} {project.title}</Link>}
                    {canEdit && (
                      <div className="task-actions">
                        <button type="button" className="icon-btn" aria-label="Move left" disabled={t.status === 'todo'} onClick={() => move(t, -1)}>←</button>
                        <button type="button" className="icon-btn" aria-label="Move right" disabled={t.status === 'done'} onClick={() => move(t, 1)}>→</button>
                        <button type="button" className="icon-btn danger" aria-label="Delete task" onClick={() => { removeTask(t.id); toast('Task removed', { icon: '🗑' }); }}>✕</button>
                      </div>
                    )}
                  </article>
                );
              })}
              {!items.length && <p className="column-empty">{canEdit ? 'Drop tasks here' : 'Nothing here'}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

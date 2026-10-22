import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seedStatuses, seedTasks } from '../data/seedTracker';

const TrackerContext = createContext(null);
const TASKS_KEY = 'dd_tasks_v1';
const STATUS_KEY = 'dd_status_v1';

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted storage → fall through to seed */
  }
  return fallback();
};

/** Single source of truth for employee statuses + tasks. Persists to localStorage
 *  and syncs across browser tabs, so dashboard numbers update in real time. */
export function TrackerProvider({ children }) {
  const [tasks, setTasks] = useState(() => read(TASKS_KEY, seedTasks));
  const [statuses, setStatuses] = useState(() => read(STATUS_KEY, seedStatuses));

  useEffect(() => {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch { /* storage full */ }
  }, [tasks]);
  useEffect(() => {
    try { localStorage.setItem(STATUS_KEY, JSON.stringify(statuses)); } catch { /* storage full */ }
  }, [statuses]);

  useEffect(() => {
    const onStorage = (e) => {
      if (!e.newValue) return;
      if (e.key === TASKS_KEY) setTasks(JSON.parse(e.newValue));
      if (e.key === STATUS_KEY) setStatuses(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getStatus = useCallback((userId) => statuses[userId] || 'Active', [statuses]);
  const setStatus = useCallback((userId, status) => setStatuses((s) => ({ ...s, [userId]: status })), []);

  const addTask = useCallback(({ userId, title, priority, deadline, projectId }) => {
    const task = {
      id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      userId: Number(userId), title, priority, deadline: deadline || '', projectId: projectId || '',
      status: 'todo', createdAt: new Date().toISOString(), completedAt: null,
    };
    setTasks((list) => [task, ...list]);
    return task;
  }, []);

  const moveTask = useCallback((id, status) => {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : null } : t)));
  }, []);

  const removeTask = useCallback((id) => setTasks((list) => list.filter((t) => t.id !== id)), []);
  const tasksFor = useCallback((userId) => tasks.filter((t) => Number(t.userId) === Number(userId)), [tasks]);

  const value = useMemo(
    () => ({ tasks, statuses, getStatus, setStatus, addTask, moveTask, removeTask, tasksFor }),
    [tasks, statuses, getStatus, setStatus, addTask, moveTask, removeTask, tasksFor],
  );
  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker must be used inside <TrackerProvider>');
  return ctx;
}

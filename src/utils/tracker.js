/* Constants + pure helpers for the Employee & Project Tracking features. */

export const STATUS_META = {
  Active: { color: '#34d399' },
  'In Meeting': { color: '#fbbf24' },
  'On Leave': { color: '#f87171' },
};
export const STATUS_LIST = Object.keys(STATUS_META);

export const PRIORITIES = ['High', 'Medium', 'Low'];
export const PRIORITY_META = {
  High: { color: '#f87171', rank: 0 },
  Medium: { color: '#fbbf24', rank: 1 },
  Low: { color: '#60a5fa', rank: 2 },
};

export const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'progress', label: 'In Progress' },
  { key: 'done', label: 'Completed' },
];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY = 86400000;
export const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const parseDay = (s) => new Date(`${s}T00:00:00`);
export const daysUntil = (s) => Math.round((parseDay(s) - startOfDay()) / DAY);
const short = (s) => parseDay(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** → { label, tone: 'danger' | 'warn' | 'muted' } or null when no deadline. */
export function deadlineInfo(deadline, done = false) {
  if (!deadline) return null;
  if (done) return { label: `Due ${short(deadline)}`, tone: 'muted' };
  const d = daysUntil(deadline);
  if (d < 0) return { label: `Overdue by ${-d}d`, tone: 'danger' };
  if (d === 0) return { label: 'Due today', tone: 'warn' };
  if (d <= 3) return { label: `Due in ${d}d`, tone: 'warn' };
  return { label: `Due ${short(deadline)}`, tone: 'muted' };
}

export const sortTasks = (list) =>
  [...list].sort(
    (a, b) =>
      PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank ||
      (a.deadline || '9999').localeCompare(b.deadline || '9999'),
  );

const RANGES = { '7D': { days: 7, step: 1 }, '30D': { days: 30, step: 3 }, '90D': { days: 90, step: 10 } };

/** Tasks created vs completed, bucketed over the chosen range. */
export function buildTimeline(tasks, range = '30D') {
  const { days, step } = RANGES[range] || RANGES['30D'];
  const start = startOfDay(Date.now() - (days - 1) * DAY);
  const n = Math.ceil(days / step);
  const labels = [];
  const created = Array(n).fill(0);
  const completed = Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    labels.push(new Date(start.getTime() + i * step * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  }
  const slot = (iso) => {
    const idx = Math.floor((startOfDay(iso) - start) / DAY / step);
    return idx >= 0 && idx < n ? idx : -1;
  };
  tasks.forEach((t) => {
    const c = slot(t.createdAt);
    if (c >= 0) created[c] += 1;
    if (t.completedAt) {
      const d = slot(t.completedAt);
      if (d >= 0) completed[d] += 1;
    }
  });
  return { labels, created, completed };
}

/** Everything the dashboard needs, derived from tasks + users + projects. */
export function computeStats({ tasks, users = [], projects = [], statusOf }) {
  const done = tasks.filter((t) => t.status === 'done');
  const progress = tasks.filter((t) => t.status === 'progress');
  const open = tasks.filter((t) => t.status !== 'done');
  const overdue = open.filter((t) => t.deadline && daysUntil(t.deadline) < 0).length;
  const highPriority = open.filter((t) => t.priority === 'High').length;
  const completion = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const score = Math.max(0, Math.min(100, Math.round(((done.length + progress.length * 0.5) / Math.max(1, tasks.length)) * 100 - overdue * 5)));

  const activeProjects = projects.filter((p) => {
    const pt = tasks.filter((t) => t.projectId === p.id);
    return pt.length === 0 || pt.some((t) => t.status !== 'done');
  }).length;

  const statusCounts = Object.fromEntries(STATUS_LIST.map((s) => [s, 0]));
  users.forEach((u) => {
    const s = statusOf(u.id);
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const matrix = PRIORITIES.map(() => Array(7).fill(0));
  open.forEach((t) => {
    if (!t.deadline) return;
    matrix[PRIORITY_META[t.priority].rank][(parseDay(t.deadline).getDay() + 6) % 7] += 1;
  });

  const dueNext = [0, 1, 2, 3, 4].map((i) => open.filter((t) => t.deadline && daysUntil(t.deadline) === i).length);
  const workload = users.slice(0, 6).map((u) => open.filter((t) => Number(t.userId) === Number(u.id)).length);

  return {
    employees: users.length, totalTasks: tasks.length, done: done.length, open: open.length, overdue, highPriority,
    completion, score, activeProjects, statusCounts, matrix, dueNext, workload,
  };
}

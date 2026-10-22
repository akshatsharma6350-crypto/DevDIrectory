import { backendClient, isNetworkError } from './api';
import { seedProjects } from '../data/seedProjects';

/**
 * Project Store data layer.
 * 1. Uses the Express backend whenever it is reachable.
 * 2. Falls back to a localStorage store (seeded) so the UI keeps working offline.
 */
const LS_KEY = 'dd_projects_local';
export const CATEGORIES = ['Frontend', 'Full-Stack', 'Productivity', 'News', 'Tools', 'Games', 'Data & Charts', 'Other'];

const RANK = { High: 0, Medium: 1, Low: 2 };
let mode = 'backend';
export const getStoreMode = () => mode;

/* ---------- local fallback store ---------- */
const readLocal = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY));
    if (Array.isArray(raw)) return raw;
  } catch {
    /* ignore */
  }
  const seeded = seedProjects();
  writeLocal(seeded);
  return seeded;
};
const writeLocal = (list) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

const tagsOf = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((t) => t.trim()).filter(Boolean).slice(0, 8);

const applyFilters = (list, { q = '', category = '', sort = 'newest' } = {}) => {
  let out = [...list];
  if (category && category !== 'All') out = out.filter((p) => p.category === category);
  const term = q.trim().toLowerCase();
  if (term) out = out.filter((p) => [p.title, p.description, p.author, ...p.tags].join(' ').toLowerCase().includes(term));
  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    popular: (a, b) => b.views + b.likes * 3 - (a.views + a.likes * 3),
    deadline: (a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'),
    priority: (a, b) => RANK[a.priority || 'Medium'] - RANK[b.priority || 'Medium'],
    name: (a, b) => a.title.localeCompare(b.title),
  };
  return out.sort(sorters[sort] || sorters.newest);
};

/** Run against backend; on "unreachable" run the local fallback instead. */
async function withFallback(remote, local) {
  try {
    const result = await remote();
    mode = 'backend';
    return result;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    mode = 'local';
    return local();
  }
}

const toFormData = (values, file) => {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => fd.append(k, Array.isArray(v) ? v.join(',') : v ?? ''));
  if (file) fd.append('file', file);
  return fd;
};

/* ---------- public API ---------- */
export const listProjects = (params = {}) =>
  withFallback(
    async () => (await backendClient.get('/projects', { params })).data,
    () => applyFilters(readLocal(), params),
  );

export const getProject = (id) =>
  withFallback(
    async () => (await backendClient.get(`/projects/${id}`)).data,
    () => {
      const found = readLocal().find((p) => p.id === id);
      if (!found) throw Object.assign(new Error('Project not found'), { response: { status: 404, data: { message: 'Project not found' } } });
      return found;
    },
  );

export const createProject = (values, file) =>
  withFallback(
    async () => (await backendClient.post('/projects', toFormData(values, file))).data,
    () => {
      if (values.mode === 'upload') throw new Error('Start the backend server to upload a build. You can still add a Live URL.');
      const project = {
        id: `${values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36)}`,
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        tags: tagsOf(values.tags),
        type: values.launchUrl.startsWith('/') ? 'internal' : 'external',
        launchUrl: values.launchUrl.trim(),
        repoUrl: values.repoUrl.trim(),
        icon: values.icon,
        accent: values.accent,
        author: values.author.trim() || 'Unknown',
        priority: values.priority || 'Medium',
        deadline: values.deadline || '',
        featured: false,
        views: 0,
        likes: 0,
        createdAt: new Date().toISOString(),
      };
      writeLocal([project, ...readLocal()]);
      return project;
    },
  );

export const updateProject = (id, values, file) =>
  withFallback(
    async () => (await backendClient.put(`/projects/${id}`, toFormData(values, file))).data,
    () => {
      const list = readLocal();
      const i = list.findIndex((p) => p.id === id);
      if (i === -1) throw new Error('Project not found');
      list[i] = { ...list[i], ...values, tags: tagsOf(values.tags), type: values.launchUrl?.startsWith('/') ? 'internal' : 'external' };
      writeLocal(list);
      return list[i];
    },
  );

export const deleteProject = (id) =>
  withFallback(
    async () => {
      await backendClient.delete(`/projects/${id}`);
      return true;
    },
    () => {
      writeLocal(readLocal().filter((p) => p.id !== id));
      return true;
    },
  );

export const trackView = (id) =>
  withFallback(
    async () => (await backendClient.post(`/projects/${id}/view`)).data,
    () => {
      const list = readLocal();
      const p = list.find((x) => x.id === id);
      if (p) p.views += 1;
      writeLocal(list);
      return { views: p?.views ?? 0 };
    },
  ).catch(() => null);

export const reactToProject = (id, delta) =>
  withFallback(
    async () => (await backendClient.post(`/projects/${id}/like`, { delta })).data,
    () => {
      const list = readLocal();
      const p = list.find((x) => x.id === id);
      if (p) p.likes = Math.max(0, p.likes + delta);
      writeLocal(list);
      return { likes: p?.likes ?? 0 };
    },
  );

/** Resolves true when the Express backend answers /health. */
export async function checkBackend() {
  try {
    await backendClient.get('/health', { timeout: 2500 });
    mode = 'backend';
    return true;
  } catch {
    mode = 'local';
    return false;
  }
}

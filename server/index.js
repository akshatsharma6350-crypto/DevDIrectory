import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readDb, writeDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_DIR = path.join(__dirname, 'storage', 'apps');
fs.mkdirSync(APPS_DIR, { recursive: true });

const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'devdirectory-dev-secret';
const ORIGINS = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()) : true;
const CATEGORIES = ['Frontend', 'Full-Stack', 'Productivity', 'News', 'Tools', 'Games', 'Data & Charts', 'Other'];
const RANK = { High: 0, Medium: 1, Low: 2 };
const MAX_UPLOAD = 25 * 1024 * 1024;
const MAX_UNPACKED = 80 * 1024 * 1024;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const app = express();
app.use(cors({ origin: ORIGINS }));
app.use(express.json({ limit: '1mb' }));
app.use('/apps', express.static(APPS_DIR, { index: 'index.html' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD } });

/* ---------- helpers ---------- */
function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new HttpError(401, 'Session expired — please sign in again'));
  }
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

function parseTags(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(',');
  return [...new Set(list.map((t) => t.trim()).filter(Boolean))].slice(0, 8);
}

function validateProject(body, { hasFile, existing }) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const mode = body.mode === 'upload' ? 'upload' : 'url';
  const launchUrl = String(body.launchUrl || '').trim();
  const repoUrl = String(body.repoUrl || '').trim();
  const priority = ['High', 'Medium', 'Low'].includes(body.priority) ? body.priority : 'Medium';
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(body.deadline || '') ? body.deadline : '';

  if (title.length < 3 || title.length > 60) throw new HttpError(400, 'Title must be 3–60 characters');
  if (description.length < 20 || description.length > 400) throw new HttpError(400, 'Description must be 20–400 characters');
  if (!CATEGORIES.includes(body.category)) throw new HttpError(400, 'Invalid category');
  if (repoUrl && !/^https?:\/\//i.test(repoUrl)) throw new HttpError(400, 'Repository link must start with http(s)://');

  let type;
  if (mode === 'upload') {
    if (!hasFile && !(existing && existing.type === 'hosted')) throw new HttpError(400, 'Upload a .zip build or a single .html file');
    type = 'hosted';
  } else {
    if (!/^https?:\/\//i.test(launchUrl) && !launchUrl.startsWith('/')) throw new HttpError(400, 'Live URL must start with http(s)://');
    type = launchUrl.startsWith('/') ? 'internal' : 'external';
  }

  return {
    title,
    description,
    category: body.category,
    tags: parseTags(body.tags),
    repoUrl,
    priority,
    deadline,
    icon: String(body.icon || '🚀').slice(0, 4),
    accent: /^#[0-9a-f]{6}$/i.test(body.accent || '') ? body.accent : '#d4af6a',
    author: String(body.author || '').trim().slice(0, 60) || 'Unknown',
    type,
    launchUrl,
  };
}

function installBuild(id, file) {
  const dest = path.join(APPS_DIR, id);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const name = (file.originalname || '').toLowerCase();

  if (name.endsWith('.html') || name.endsWith('.htm')) {
    fs.writeFileSync(path.join(dest, 'index.html'), file.buffer);
    return `/apps/${id}/index.html`;
  }
  if (!name.endsWith('.zip')) throw new HttpError(400, 'Only .zip or .html uploads are supported');

  let zip;
  try {
    zip = new AdmZip(file.buffer);
  } catch {
    throw new HttpError(400, 'That zip file looks corrupted');
  }
  const entries = zip.getEntries().filter((e) => !e.isDirectory && !e.entryName.startsWith('__MACOSX'));
  let total = 0;
  for (const entry of entries) {
    total += entry.header.size;
    if (total > MAX_UNPACKED) throw new HttpError(400, 'Unpacked project is larger than 80 MB');
    const target = path.resolve(dest, entry.entryName);
    if (!target.startsWith(dest + path.sep)) continue; // block zip-slip
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, entry.getData());
  }
  const index = entries
    .filter((e) => /(^|\/)index\.html$/i.test(e.entryName))
    .sort((a, b) => a.entryName.split('/').length - b.entryName.split('/').length)[0];
  if (!index) {
    fs.rmSync(dest, { recursive: true, force: true });
    throw new HttpError(400, 'No index.html found inside the zip');
  }
  return `/apps/${id}/${encodeURI(index.entryName)}`;
}

/* ---------- routes ---------- */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), time: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const user = readDb().users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    throw new HttpError(401, 'Incorrect email or password');
  }
  const token = jwt.sign({ sub: user.id, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: publicUser(user) });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = readDb().users.find((u) => u.id === req.user.sub);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  res.json({ user: publicUser(user) });
});

app.get('/api/projects', (req, res) => {
  const { q = '', category = '', sort = 'newest' } = req.query;
  let list = [...readDb().projects];
  if (category && category !== 'All') list = list.filter((p) => p.category === category);
  const term = String(q).trim().toLowerCase();
  if (term) {
    list = list.filter((p) => [p.title, p.description, p.author, ...p.tags].join(' ').toLowerCase().includes(term));
  }
  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    popular: (a, b) => b.views + b.likes * 3 - (a.views + a.likes * 3),
    deadline: (a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'),
    priority: (a, b) => (RANK[a.priority] ?? 1) - (RANK[b.priority] ?? 1),
    name: (a, b) => a.title.localeCompare(b.title),
  };
  list.sort(sorters[sort] || sorters.newest);
  res.json(list);
});

app.get('/api/projects/:id', (req, res) => {
  const project = readDb().projects.find((p) => p.id === req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  res.json(project);
});

app.post('/api/projects', auth, upload.single('file'), (req, res) => {
  const db = readDb();
  const fields = validateProject(req.body, { hasFile: Boolean(req.file) });
  const id = `${fields.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)}-${crypto.randomBytes(3).toString('hex')}`;
  if (fields.type === 'hosted') fields.launchUrl = installBuild(id, req.file);
  const project = { id, ...fields, featured: false, views: 0, likes: 0, createdAt: new Date().toISOString(), createdBy: req.user.sub };
  db.projects.unshift(project);
  writeDb();
  res.status(201).json(project);
});

app.put('/api/projects/:id', auth, upload.single('file'), (req, res) => {
  const db = readDb();
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) throw new HttpError(404, 'Project not found');
  const existing = db.projects[index];
  const fields = validateProject(req.body, { hasFile: Boolean(req.file), existing });
  if (fields.type === 'hosted') {
    fields.launchUrl = req.file ? installBuild(existing.id, req.file) : existing.launchUrl;
  } else if (existing.type === 'hosted') {
    fs.rmSync(path.join(APPS_DIR, existing.id), { recursive: true, force: true });
  }
  db.projects[index] = { ...existing, ...fields };
  writeDb();
  res.json(db.projects[index]);
});

app.delete('/api/projects/:id', auth, (req, res) => {
  const db = readDb();
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) throw new HttpError(404, 'Project not found');
  const [removed] = db.projects.splice(index, 1);
  if (removed.type === 'hosted') fs.rmSync(path.join(APPS_DIR, removed.id), { recursive: true, force: true });
  writeDb();
  res.status(204).end();
});

app.post('/api/projects/:id/view', (req, res) => {
  const project = readDb().projects.find((p) => p.id === req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  project.views += 1;
  writeDb();
  res.json({ views: project.views });
});

app.post('/api/projects/:id/like', (req, res) => {
  const project = readDb().projects.find((p) => p.id === req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  const delta = Number(req.body?.delta) === -1 ? -1 : 1;
  project.likes = Math.max(0, project.likes + delta);
  writeDb();
  res.json({ likes: project.likes });
});

app.get('/api/stats', (_req, res) => {
  const { projects } = readDb();
  res.json({
    projects: projects.length,
    views: projects.reduce((s, p) => s + p.views, 0),
    likes: projects.reduce((s, p) => s + p.likes, 0),
    categories: [...new Set(projects.map((p) => p.category))].length,
  });
});

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint not found')));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 25 MB' : err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`DevDirectory API running on http://localhost:${PORT}`);
  console.log('Demo login → aarav.sharma@devdirectory.in / devdir@123');
});

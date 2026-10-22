import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AlertBanner from '../components/AlertBanner';
import { DeadlineChip, PriorityBadge } from '../components/Badges';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { getErrorMessage } from '../services/api';
import { PRIORITIES } from '../utils/tracker';
import { CATEGORIES, checkBackend, createProject, getProject, updateProject } from '../services/projectService';

const ICONS = ['🚀', '✅', '📰', '🧭', '🎮', '📊', '🛒', '🎵', '🌦', '💬', '🧪', '🛠'];
const COLORS = ['#d4af6a', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#22d3ee', '#f87171'];

function validate(v, { needsFile, hasFile, offline }) {
  const e = {};
  const t = v.title.trim().length;
  if (t < 3 || t > 60) e.title = 'Title must be 3–60 characters.';
  const d = v.description.trim().length;
  if (d < 20 || d > 400) e.description = `Description must be 20–400 characters (now ${d}).`;
  if (v.mode === 'url') {
    if (!/^https?:\/\/\S+\.\S+/i.test(v.launchUrl.trim()) && !v.launchUrl.trim().startsWith('/')) e.launchUrl = 'Enter a full URL starting with http:// or https://';
  } else if (offline) {
    e.file = 'Backend is offline — start it with “npm run server” to upload builds.';
  } else if (needsFile && !hasFile) {
    e.file = 'Choose a .zip build or a single .html file.';
  }
  if (v.deadline && Number.isNaN(Date.parse(v.deadline))) e.deadline = 'Pick a valid date.';
  if (v.repoUrl.trim() && !/^https?:\/\//i.test(v.repoUrl.trim())) e.repoUrl = 'Repository link must start with http(s)://';
  return e;
}

export default function AddProject() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef(null);

  const existing = useFetch(() => (editing ? getProject(id) : Promise.resolve(null)), [id]);
  const backend = useFetch(checkBackend, []);
  const [file, setFile] = useState(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);

  const base = useMemo(() => {
    const p = existing.data;
    return {
      title: p?.title ?? '',
      description: p?.description ?? '',
      category: p?.category ?? CATEGORIES[0],
      tags: p?.tags?.join(', ') ?? '',
      mode: p ? (p.type === 'hosted' ? 'upload' : 'url') : 'url',
      launchUrl: p && p.type !== 'hosted' ? p.launchUrl : '',
      repoUrl: p?.repoUrl ?? '',
      icon: p?.icon ?? ICONS[0],
      accent: p?.accent ?? COLORS[0],
      author: p?.author ?? user?.name ?? '',
      priority: p?.priority ?? 'Medium',
      deadline: p?.deadline ?? '',
    };
  }, [existing.data, user]);

  const v = draft ?? base;
  const set = (k, val) => setDraft({ ...v, [k]: val });
  const offline = backend.data === false;
  const needsFile = v.mode === 'upload' && !(editing && existing.data?.type === 'hosted');
  const errors = validate(v, { needsFile, hasFile: Boolean(file), offline });
  const valid = Object.keys(errors).length === 0;
  const show = (k) => touched && errors[k];

  if (editing && existing.loading) return <div className="container page"><SkeletonLoader variant="profile" /></div>;
  if (editing && existing.error) {
    return <div className="container page"><AlertBanner title="Could not load project" onRetry={existing.retry}>{getErrorMessage(existing.error)}</AlertBanner></div>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const payload = { ...v };
      const run = editing ? updateProject(id, payload, file) : createProject(payload, file);
      const saved = await toast.promise(run, {
        loading: editing ? 'Saving changes…' : 'Publishing to the Store…',
        success: editing ? 'Project updated' : 'Project added to the Store 🚀',
        error: (err) => getErrorMessage(err),
      });
      navigate(`/projects/${saved.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <Link to="/projects" className="link back">← Project Store</Link>
      <header className="page-head">
        <span className="eyebrow">{editing ? 'Edit project' : 'New project'}</span>
        <h1>{editing ? `Edit “${existing.data.title}”` : 'Add a project to the Store'}</h1>
        <p className="muted">Upload a finished build or link a live demo — it appears in the Store instantly.</p>
      </header>

      {error && <AlertBanner title="Could not save project" onRetry={() => submit({ preventDefault() {} })}>{error}</AlertBanner>}

      <div className="split">
        <form className="card form" onSubmit={submit} noValidate>
          <label className="field">
            <span>Project title</span>
            <input value={v.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. India Pulse — News Reader" maxLength={60} className={show('title') ? 'invalid' : ''} />
            {show('title') && <small className="error-text">{errors.title}</small>}
          </label>

          <label className="field">
            <span>Description</span>
            <textarea rows="4" value={v.description} onChange={(e) => set('description', e.target.value)} placeholder="What does it do and who is it for?" className={show('description') ? 'invalid' : ''} />
            <div className="field-foot">
              {show('description') ? <small className="error-text">{errors.description}</small> : <small />}
              <small className="counter">{v.description.length}/400</small>
            </div>
          </label>

          <div className="row-2">
            <label className="field">
              <span>Category</span>
              <select value={v.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="field">
              <span>Author</span>
              <input value={v.author} onChange={(e) => set('author', e.target.value)} placeholder="Your name" />
            </label>
          </div>

          <div className="row-2">
            <label className="field">
              <span>Priority</span>
              <select value={v.priority} onChange={(e) => set('priority', e.target.value)}>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            </label>
            <label className="field">
              <span>Deadline <small className="muted">(optional)</small></span>
              <input type="date" value={v.deadline} onChange={(e) => set('deadline', e.target.value)} className={show('deadline') ? 'invalid' : ''} />
              {show('deadline') && <small className="error-text">{errors.deadline}</small>}
            </label>
          </div>

          <label className="field">
            <span>Tags <small className="muted">(comma separated)</small></span>
            <input value={v.tags} onChange={(e) => set('tags', e.target.value)} placeholder="React, API, Responsive" />
          </label>

          <fieldset className="field">
            <legend>How should it launch?</legend>
            <div className="segmented">
              <button type="button" className={v.mode === 'url' ? 'active' : ''} onClick={() => set('mode', 'url')}>🔗 Live URL</button>
              <button type="button" className={v.mode === 'upload' ? 'active' : ''} onClick={() => set('mode', 'upload')}>📦 Upload build</button>
            </div>
          </fieldset>

          {v.mode === 'url' ? (
            <label className="field">
              <span>Live URL</span>
              <input type="url" value={v.launchUrl} onChange={(e) => set('launchUrl', e.target.value)} placeholder="https://my-todo-app.netlify.app" className={show('launchUrl') ? 'invalid' : ''} />
              {show('launchUrl') && <small className="error-text">{errors.launchUrl}</small>}
            </label>
          ) : (
            <div className="field">
              <span>Project build</span>
              <button type="button" className={`dropzone ${show('file') ? 'invalid' : ''}`} onClick={() => fileRef.current?.click()}>
                <strong>{file ? `📄 ${file.name}` : editing && existing.data?.type === 'hosted' ? 'Keep current build — or choose a new file' : 'Click to choose a .zip or .html file'}</strong>
                <small className="muted">Max 25 MB · zip must contain index.html · Vite builds need <code>base: './'</code></small>
              </button>
              <input ref={fileRef} type="file" accept=".zip,.html,.htm" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {show('file') && <small className="error-text">{errors.file}</small>}
            </div>
          )}

          <label className="field">
            <span>Source repository <small className="muted">(optional)</small></span>
            <input type="url" value={v.repoUrl} onChange={(e) => set('repoUrl', e.target.value)} placeholder="https://github.com/you/project" className={show('repoUrl') ? 'invalid' : ''} />
            {show('repoUrl') && <small className="error-text">{errors.repoUrl}</small>}
          </label>

          <div className="field">
            <span>Icon</span>
            <div className="picker">{ICONS.map((i) => <button key={i} type="button" className={v.icon === i ? 'active' : ''} onClick={() => set('icon', i)} aria-label={`Icon ${i}`}>{i}</button>)}</div>
          </div>
          <div className="field">
            <span>Accent colour</span>
            <div className="picker">{COLORS.map((c) => <button key={c} type="button" className={`swatch ${v.accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => set('accent', c)} aria-label={`Colour ${c}`} />)}</div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish to Store'}</button>
            <Link to="/projects" className="btn btn-ghost">Cancel</Link>
          </div>
        </form>

        <aside className="card preview project-card" style={{ '--accent': v.accent }} aria-label="Card preview">
          <span className="eyebrow">Card preview</span>
          <div className="project-banner"><span className="project-icon">{v.icon}</span><span className="badge">{v.category}</span></div>
          <div className="project-body">
            <h3>{v.title.trim() || 'Your project title'}</h3>
            <div className="tags"><PriorityBadge priority={v.priority} /><DeadlineChip deadline={v.deadline} /></div>
            <p className="clamp">{v.description.trim() || 'Your description will appear here.'}</p>
            <div className="chips">{v.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4).map((t) => <span key={t} className="chip">{t}</span>)}</div>
            <p className="meta">By {v.author || '—'}</p>
          </div>
          {offline && <p className="muted small">⚠ Backend offline — project will be stored in this browser only.</p>}
        </aside>
      </div>
    </div>
  );
}

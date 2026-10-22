import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AlertBanner from '../components/AlertBanner';
import ProjectCard from '../components/ProjectCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import useFetch from '../hooks/useFetch';
import useLocalStorage from '../hooks/useLocalStorage';
import { getErrorMessage } from '../services/api';
import { PRIORITIES } from '../utils/tracker';
import { CATEGORIES, checkBackend, listProjects, reactToProject } from '../services/projectService';

export default function ProjectStore() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [priority, setPriority] = useState('All');
  const [liked, setLiked] = useLocalStorage('dd_liked_projects', []);
  const debounced = useDebounce(query, 300);

  const { data, loading, error, retry, setData } = useFetch(
    () => listProjects({ q: debounced, category, sort }),
    [debounced, category, sort],
  );
  const backend = useFetch(checkBackend, []);

  const [totals, setTotals] = useState(null);
  useEffect(() => {
    if (data && !debounced && category === 'All') {
      setTotals({ count: data.length, views: data.reduce((s, p) => s + p.views, 0), likes: data.reduce((s, p) => s + p.likes, 0) });
    }
  }, [data, debounced, category]);

  const visible = (data || []).filter((p) => priority === 'All' || (p.priority || 'Medium') === priority);

  const onLike = async (project) => {
    const isLiked = liked.includes(project.id);
    setLiked((l) => (isLiked ? l.filter((x) => x !== project.id) : [...l, project.id]));
    setData((list) => list.map((p) => (p.id === project.id ? { ...p, likes: Math.max(0, p.likes + (isLiked ? -1 : 1)) } : p)));
    try {
      await reactToProject(project.id, isLiked ? -1 : 1);
    } catch {
      toast.error('Could not update like — resyncing');
      retry(); // resync with server on failure
    }
  };

  return (
    <div className="container page">
      <header className="page-head page-head-row">
        <div>
          <span className="eyebrow">Project Store</span>
          <h1>Launch what the team built</h1>
          <p className="muted">A private app store for engineering projects — open any of them right inside the portal.</p>
        </div>
        <div className="head-actions">
          {backend.data !== null && !backend.loading && (
            <span className={`status-pill ${backend.data ? 'ok' : 'warn'}`} title={backend.data ? 'Connected to the Express API' : 'Run "npm run server" to enable uploads and shared storage'}>
              <i /> {backend.data ? 'Live backend' : 'Local mode'}
            </span>
          )}
          <Link to={isAuthenticated ? '/projects/new' : '/login'} state={isAuthenticated ? undefined : { from: { pathname: '/projects/new' } }} className="btn btn-primary">＋ Add project</Link>
        </div>
      </header>

      {totals && (
        <div className="mini-stats">
          <span><strong>{totals.count}</strong> projects</span>
          <span><strong>{totals.views}</strong> launches</span>
          <span><strong>{totals.likes}</strong> likes</span>
        </div>
      )}

      <div className="toolbar">
        <div className="search">
          <span aria-hidden="true">🔍</span>
          <input type="search" placeholder="Search projects, tags or authors…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search projects" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort projects">
          <option value="newest">Newest first</option>
          <option value="popular">Most popular</option>
          <option value="deadline">Nearest deadline</option>
          <option value="priority">Highest priority</option>
          <option value="name">A → Z</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
          <option value="All">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
        </select>
      </div>

      <div className="chips chips-scroll" role="group" aria-label="Filter by category">
        {['All', ...CATEGORIES].map((c) => (
          <button key={c} type="button" className={`chip chip-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {error && <AlertBanner title="Could not load projects" onRetry={retry}>{getErrorMessage(error)}</AlertBanner>}
      {loading && !data && <SkeletonLoader variant="project" count={6} />}

      {data && (visible.length ? (
        <div className={`grid ${loading ? 'dim' : ''}`}>
          {visible.map((p) => <ProjectCard key={p.id} project={p} liked={liked.includes(p.id)} onLike={onLike} />)}
        </div>
      ) : (
        <div className="empty">
          <span aria-hidden="true">📭</span>
          <h3>No projects found</h3>
          <p className="muted">Try another search — or add your own project.</p>
          <Link to="/projects/new" className="btn btn-primary">Add a project</Link>
        </div>
      ))}
    </div>
  );
}

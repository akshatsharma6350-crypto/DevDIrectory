import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AlertBanner from '../components/AlertBanner';
import { DeadlineChip, PriorityBadge } from '../components/Badges';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { getErrorMessage } from '../services/api';
import { deleteProject, getProject, trackView } from '../services/projectService';
import confirmToast from '../utils/confirmToast';
import { formatDate, resolveLaunchUrl } from '../utils/helpers';

const DEVICES = [
  { id: 'desktop', label: '🖥 Desktop', width: '100%' },
  { id: 'tablet', label: '📱 Tablet', width: '768px' },
  { id: 'mobile', label: '📲 Mobile', width: '390px' },
];

export default function ProjectViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: project, loading, error, retry } = useFetch(() => getProject(id), [id]);
  const [device, setDevice] = useState('desktop');
  const [frameKey, setFrameKey] = useState(0);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    // count one launch per browser session (also avoids StrictMode double-fire)
    const key = `dd_viewed_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackView(id);
  }, [id]);
  useEffect(() => setFrameLoaded(false), [frameKey, id]);

  if (loading) return <div className="container page"><SkeletonLoader variant="profile" /></div>;

  if (error) {
    const notFound = error.response?.status === 404;
    return (
      <div className="container page">
        {notFound ? (
          <div className="empty"><span aria-hidden="true">🛰</span><h2>Project not found</h2><Link to="/projects" className="btn btn-primary">Back to the Store</Link></div>
        ) : (
          <AlertBanner title="Could not open this project" onRetry={retry}>{getErrorMessage(error)}</AlertBanner>
        )}
      </div>
    );
  }

  const url = resolveLaunchUrl(project.launchUrl);
  const isPortal = project.launchUrl === '/';
  const device_ = DEVICES.find((d) => d.id === device);

  const remove = async () => {
    if (!(await confirmToast(`Delete “${project.title}” from the Store? This cannot be undone.`))) return;
    setDeleting(true);
    setActionError('');
    try {
      await toast.promise(deleteProject(project.id), { loading: 'Deleting project…', success: 'Project deleted', error: (e) => getErrorMessage(e) });
      navigate('/projects', { replace: true });
    } catch (err) {
      setActionError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <div className="container page viewer" style={{ '--accent': project.accent }}>
      <Link to="/projects" className="link back">← Project Store</Link>

      <header className="viewer-head">
        <span className="project-icon big" aria-hidden="true">{project.icon}</span>
        <div>
          <h1>{project.title}</h1>
          <p className="muted">{project.category} · by {project.author} · added {formatDate(project.createdAt)}</p>
          <div className="tags"><PriorityBadge priority={project.priority || 'Medium'} /><DeadlineChip deadline={project.deadline} /></div>
        </div>
      </header>

      {actionError && <AlertBanner title="Action failed">{actionError}</AlertBanner>}

      <div className="viewer-bar">
        <div className="segmented" role="group" aria-label="Preview size">
          {DEVICES.map((d) => (
            <button key={d.id} type="button" className={device === d.id ? 'active' : ''} onClick={() => setDevice(d.id)}>{d.label}</button>
          ))}
        </div>
        <div className="viewer-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setFrameKey((k) => k + 1)}>⟳ Reload</button>
          {!isPortal && <a className="btn btn-sm btn-ghost" href={url} target="_blank" rel="noreferrer">↗ Open in new tab</a>}
          {project.repoUrl && <a className="btn btn-sm btn-ghost" href={project.repoUrl} target="_blank" rel="noreferrer">⌥ Source</a>}
        </div>
      </div>

      <div className="frame-stage">
        {isPortal ? (
          <div className="empty"><span aria-hidden="true">🧭</span><h3>You are already inside this project</h3><p className="muted">DevDirectory is the portal hosting this store.</p></div>
        ) : (
          <div className="frame-shell" style={{ maxWidth: device_.width }}>
            {!frameLoaded && <div className="frame-loading"><SkeletonLoader variant="line" count={4} /></div>}
            <iframe
              key={frameKey}
              title={project.title}
              src={url}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={() => setFrameLoaded(true)}
            />
          </div>
        )}
      </div>
      {!isPortal && <p className="muted small center-text">Blank preview? Some websites block embedding — use “Open in new tab”.</p>}

      <section className="card detail">
        <h2>About this project</h2>
        <p>{project.description}</p>
        <div className="chips">{project.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        <div className="detail-meta">
          <span>👁 {project.views} launches</span>
          <span>♥ {project.likes} likes</span>
          <span>📦 {project.type === 'hosted' ? 'Hosted build' : project.type === 'internal' ? 'Bundled app' : 'External link'}</span>
        </div>
        {isAuthenticated && (
          <div className="form-actions">
            <Link to={`/projects/${project.id}/edit`} className="btn btn-sm btn-ghost">✎ Edit</Link>
            <button type="button" className="btn btn-sm btn-danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : '🗑 Delete'}</button>
          </div>
        )}
      </section>
    </div>
  );
}

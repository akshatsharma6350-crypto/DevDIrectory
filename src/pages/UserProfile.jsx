import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AlertBanner from '../components/AlertBanner';
import ProjectCard from '../components/ProjectCard';
import SkeletonLoader from '../components/SkeletonLoader';
import StatusBadge from '../components/StatusBadge';
import TaskBoard from '../components/TaskBoard';
import { useAuth } from '../context/AuthContext';
import { useTracker } from '../context/TrackerContext';
import useFetch from '../hooks/useFetch';
import { getErrorMessage } from '../services/api';
import { deleteLocalPost, getPostsByUser } from '../services/postService';
import { listProjects } from '../services/projectService';
import { getUserById } from '../services/userService';
import confirmToast from '../utils/confirmToast';
import { formatDate, gradientFor, initials } from '../utils/helpers';

export default function UserProfile() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { tasksFor } = useTracker();
  const [tab, setTab] = useState('tasks');
  const [openPost, setOpenPost] = useState(null);

  const profile = useFetch(() => getUserById(id), [id]);
  const posts = useFetch(() => getPostsByUser(id), [id]);
  const projects = useFetch(() => listProjects(), [id]);

  const user = profile.data;
  const myProjects = (projects.data || []).filter((p) => user && p.author === user.name);
  const myTasks = tasksFor(id);
  const doneCount = myTasks.filter((t) => t.status === 'done').length;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user.email);
      toast.success('Email copied to clipboard');
    } catch {
      toast.error('Could not copy — please copy it manually');
    }
  };

  const removePost = async (post) => {
    if (!(await confirmToast('Delete this publication from this device?'))) return;
    deleteLocalPost(post.id);
    posts.retry();
    toast.success('Publication deleted');
  };

  if (profile.loading) return <div className="container page"><SkeletonLoader variant="profile" /></div>;

  if (profile.error) {
    const notFound = profile.error.response?.status === 404;
    return (
      <div className="container page">
        {notFound ? (
          <div className="empty">
            <span aria-hidden="true">🧐</span>
            <h2>Developer not found</h2>
            <p className="muted">There is no developer with id “{id}”.</p>
            <Link to="/users" className="btn btn-primary">Back to directory</Link>
          </div>
        ) : (
          <AlertBanner title="Could not load this profile" onRetry={profile.retry}>{getErrorMessage(profile.error)}</AlertBanner>
        )}
      </div>
    );
  }

  return (
    <div className="container page">
      <Link to="/users" className="link back">← All developers</Link>

      <section className="profile-hero card">
        <div className="avatar avatar-xl" style={{ background: gradientFor(user.id) }}>{initials(user.name)}</div>
        <div className="profile-main">
          <h1>{user.name}</h1>
          <p className="role">{user.role} · {user.company}</p>
          <StatusBadge userId={user.id} name={user.name} />
          <p className="bio">{user.bio}</p>
          <div className="chips">{user.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        </div>
        <ul className="profile-facts">
          <li><span>📍</span> {user.city}</li>
          <li><span>🏅</span> {user.exp} yrs experience</li>
          <li><span>✅</span> {doneCount}/{myTasks.length} tasks completed</li>
          <li><span>📞</span> {user.phone}</li>
          <li><button type="button" className="btn btn-sm btn-ghost" onClick={copyEmail}>✉ {user.email}</button></li>
        </ul>
      </section>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'tasks'} className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>Task tracker ({myTasks.length})</button>
        <button role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Publications {posts.data ? `(${posts.data.length})` : ''}</button>
        <button role="tab" aria-selected={tab === 'projects'} className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>Store projects {projects.data ? `(${myProjects.length})` : ''}</button>
      </div>

      {tab === 'tasks' && <TaskBoard userId={user.id} userName={user.name} projects={projects.data || []} canEdit={isAuthenticated} />}

      {tab === 'posts' && (
        <section>
          {posts.error && <AlertBanner title="Could not load publications" onRetry={posts.retry}>{getErrorMessage(posts.error)}</AlertBanner>}
          {posts.loading && <SkeletonLoader variant="line" count={5} />}
          {posts.data && (
            <ul className="post-list">
              {posts.data.map((p) => {
                const open = openPost === p.id;
                return (
                  <li key={p.id} className="card post">
                    <button type="button" className="post-head" aria-expanded={open} onClick={() => setOpenPost(open ? null : p.id)}>
                      <h3>{p.title}{p.local && <span className="badge badge-new">Saved locally</span>}</h3>
                      <span aria-hidden="true">{open ? '−' : '+'}</span>
                    </button>
                    {open && (
                      <div className="post-body">
                        <p>{p.body}{p.createdAt && <small className="muted"> — published {formatDate(p.createdAt)}</small>}</p>
                        {p.local && isAuthenticated && <button type="button" className="btn btn-sm btn-danger" onClick={() => removePost(p)}>🗑 Delete</button>}
                      </div>
                    )}
                  </li>
                );
              })}
              {!posts.data.length && <p className="muted">No publications yet.</p>}
            </ul>
          )}
        </section>
      )}

      {tab === 'projects' && (
        <section>
          {projects.error && <AlertBanner title="Could not load projects" onRetry={projects.retry}>{getErrorMessage(projects.error)}</AlertBanner>}
          {projects.loading && <SkeletonLoader variant="project" count={2} />}
          {projects.data && (myProjects.length ? (
            <div className="grid">{myProjects.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
          ) : (
            <div className="empty"><span aria-hidden="true">📦</span><h3>No store projects yet</h3><Link to="/projects/new" className="btn btn-ghost">Add the first one</Link></div>
          ))}
        </section>
      )}
    </div>
  );
}

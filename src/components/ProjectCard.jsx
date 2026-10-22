import { Link } from 'react-router-dom';
import { compact } from '../utils/helpers';
import { DeadlineChip, PriorityBadge } from './Badges';

export default function ProjectCard({ project, liked = false, onLike }) {
  const { id, title, description, category, tags, icon, accent, author, views, likes, type, priority, deadline } = project;
  return (
    <article className="card project-card" style={{ '--accent': accent }}>
      <div className="project-banner">
        <span className="project-icon" aria-hidden="true">{icon}</span>
        <span className="badge">{category}</span>
        {type === 'hosted' && <span className="badge badge-ghost">Hosted</span>}
      </div>
      <div className="project-body">
        <h3>{title}</h3>
        <div className="tags"><PriorityBadge priority={priority || 'Medium'} /><DeadlineChip deadline={deadline} /></div>
        <p className="clamp">{description}</p>
        <div className="chips">
          {tags.slice(0, 4).map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
        <p className="meta">By {author}</p>
      </div>
      <div className="project-footer">
        <span className="stat" title="Views">👁 {compact(views)}</span>
        <button
          type="button"
          className={`like-btn ${liked ? 'on' : ''}`}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike project' : 'Like project'}
          onClick={() => onLike?.(project)}
        >
          {liked ? '♥' : '♡'} {compact(likes)}
        </button>
        <Link to={`/projects/${id}`} className="btn btn-sm btn-primary">Launch ▶</Link>
      </div>
    </article>
  );
}

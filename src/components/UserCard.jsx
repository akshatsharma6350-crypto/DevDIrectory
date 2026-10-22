import { Link } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import { gradientFor, initials } from '../utils/helpers';
import StatusBadge from './StatusBadge';

export default function UserCard({ user, isSaved = false, onToggleSave }) {
  const { tasksFor } = useTracker();
  const open = tasksFor(user.id).filter((t) => t.status !== 'done').length;

  return (
    <article className="card user-card">
      <StatusBadge userId={user.id} name={user.name} />
      <button
        type="button"
        className={`icon-btn save-btn ${isSaved ? 'on' : ''}`}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${user.name} from saved` : `Save ${user.name}`}
        onClick={() => onToggleSave?.(user.id)}
      >
        {isSaved ? '★' : '☆'}
      </button>

      <Link to={`/users/${user.id}`} className="user-card-link">
        <div className="avatar" style={{ background: gradientFor(user.id) }}>{initials(user.name)}</div>
        <h3>{user.name}</h3>
        <p className="role">{user.role}</p>
        <p className="meta">🏢 {user.company}</p>
        <p className="meta">📍 {user.city} · 📋 {open} open task{open === 1 ? '' : 's'}</p>
        <div className="chips">
          {user.skills.slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}
        </div>
        <span className="card-cta">View profile →</span>
      </Link>
    </article>
  );
}

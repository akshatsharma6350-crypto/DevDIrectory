import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTracker } from '../context/TrackerContext';
import { STATUS_LIST, STATUS_META } from '../utils/tracker';

/** Interactive employee status. Anyone can see it; only signed-in managers can change it. */
export default function StatusBadge({ userId, name }) {
  const { getStatus, setStatus } = useTracker();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const status = getStatus(userId);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!isAuthenticated) {
      toast('Sign in as a manager to change status', { icon: '🔒' });
      return;
    }
    setOpen((o) => !o);
  };

  const choose = (next) => {
    setOpen(false);
    if (next === status) return;
    setStatus(userId, next);
    toast.success(`${name}: ${next}`);
  };

  return (
    <div className="status-wrap" ref={ref}>
      <button type="button" className="status-badge" style={{ '--c': STATUS_META[status].color }} aria-haspopup="menu" aria-expanded={open}
        title={isAuthenticated ? 'Change status' : 'Sign in to change'} onClick={toggle}>
        <i /> {status} {isAuthenticated && <span aria-hidden="true">▾</span>}
      </button>
      {open && (
        <ul className="status-menu" role="menu">
          {STATUS_LIST.map((s) => (
            <li key={s} role="none">
              <button type="button" role="menuitemradio" aria-checked={s === status} className={s === status ? 'on' : ''} style={{ '--c': STATUS_META[s].color }} onClick={() => choose(s)}>
                <i /> {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { initials } from '../utils/helpers';
import logo from '../assets/logo.svg';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Employees' },
  { to: '/projects', label: 'Projects' },
  { to: '/add-post', label: 'Publish', private: true },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    toast('Signed out', { icon: '👋' });
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="DevDirectory home">
          <img src={logo} alt="" width="34" height="34" />
          <span>Dev<em>Directory</em></span>
        </Link>

        <button type="button" className="icon-btn nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? '✕' : '☰'}
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {l.label}{l.private && !isAuthenticated && <span aria-hidden="true"> 🔒</span>}
            </NavLink>
          ))}

          <div className="nav-actions">
            <button type="button" role="switch" aria-checked={theme === 'dark'} className="theme-switch" onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={theme === 'dark' ? 'Dark mode' : 'Light mode'}>
              <span className="knob">{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>
            {isAuthenticated ? (
              <div className="user-pill">
                <span className="avatar avatar-xs">{initials(user.name)}</span>
                <span className="user-pill-name">{user.name.split(' ')[0]}</span>
                <button type="button" className="btn btn-sm btn-ghost" onClick={handleLogout}>Sign out</button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-sm btn-primary">Sign in</Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

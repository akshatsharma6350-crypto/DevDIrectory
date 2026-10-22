import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { signIn } from '../services/authService';

const DEMO = { email: 'aarav.sharma@devdirectory.in', password: 'devdir@123' };

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const target = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Guest-only route
  if (isAuthenticated) return <Navigate to={target} replace />;

  const valid = /^\S+@\S+\.\S+$/.test(form.email) && form.password.length >= 4;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const session = await signIn(form);
      login(session);
      toast.success(`Welcome, ${session.name.split(' ')[0]}!`);
      if (session.mode === 'mock') toast('Backend offline — signed in locally', { icon: 'ℹ️' });
      navigate(target, { replace: true }); // back to the exact page they wanted
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <span className="eyebrow">Welcome back</span>
        <h2>Publish, launch and collaborate.</h2>
        <ul className="ticks">
          <li>Publish bulletins to the whole org</li>
          <li>Add projects to the Store</li>
          <li>Upload builds or link live demos</li>
        </ul>
      </aside>

      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Sign in</h1>
        {from && <AlertBanner variant="info">Please sign in to open <strong>{from.pathname}</strong>.</AlertBanner>}
        {error && <AlertBanner variant="error" title="Sign-in failed">{error}</AlertBanner>}

        <label className="field">
          <span>Work email</span>
          <input type="email" autoComplete="username" placeholder="name@devdirectory.in" value={form.email} onChange={set('email')} />
        </label>
        <label className="field">
          <span>Password</span>
          <div className="input-with-btn">
            <input type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={set('password')} />
            <button type="button" className="icon-btn" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? '🙈' : '👁'}</button>
          </div>
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={!valid || busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setForm(DEMO)}>Use demo account</button>
        <p className="muted small center-text">Demo: {DEMO.email} / {DEMO.password}<br />Any valid email + 4-char password also works if the backend is offline.</p>
      </form>
    </div>
  );
}

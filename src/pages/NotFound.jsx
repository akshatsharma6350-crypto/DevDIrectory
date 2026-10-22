import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="container page notfound">
      <span className="big-404">404</span>
      <h1>This page wandered off</h1>
      <p className="muted">Nothing lives at <code>{pathname}</code>.</p>
      <Link to="/" className="btn btn-primary">Take me home</Link>
    </div>
  );
}

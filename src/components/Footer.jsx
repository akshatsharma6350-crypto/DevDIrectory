import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong className="footer-brand">Dev<em>Directory</em></strong>
          <p className="muted">Discover colleagues. Publish knowledge. Launch projects.</p>
        </div>
        <div className="footer-links">
          <Link to="/users">Developers</Link>
          <Link to="/projects">Project Store</Link>
          <Link to="/add-post">Publish</Link>
        </div>
        <p className="muted small">© {new Date().getFullYear()} DevDirectory · BCA Frontend Lab · Built with React, Axios & Express</p>
      </div>
    </footer>
  );
}

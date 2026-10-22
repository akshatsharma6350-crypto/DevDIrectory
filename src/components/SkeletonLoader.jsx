/** Non-blocking shimmer placeholders. variant: card | project | profile | line | stats */
export default function SkeletonLoader({ variant = 'card', count = 6 }) {
  if (variant === 'profile') {
    return (
      <div className="skeleton-profile" aria-busy="true" aria-label="Loading profile">
        <div className="sk sk-hero" />
        <div className="sk sk-line w60" />
        <div className="sk sk-line w80" />
        <div className="sk sk-line w40" />
      </div>
    );
  }
  if (variant === 'stats') {
    return (
      <div className="stats-grid" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="sk sk-stat" />)}
      </div>
    );
  }
  if (variant === 'line') {
    return <div aria-busy="true">{Array.from({ length: count }, (_, i) => <div key={i} className="sk sk-line" style={{ width: `${90 - i * 9}%` }} />)}</div>;
  }
  return (
    <div className="grid" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card sk-card">
          <div className={`sk ${variant === 'project' ? 'sk-banner' : 'sk-avatar'}`} />
          <div className="sk sk-line w70" />
          <div className="sk sk-line w50" />
          <div className="sk sk-line w90" />
        </div>
      ))}
    </div>
  );
}

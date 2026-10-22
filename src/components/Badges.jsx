import { PRIORITY_META, deadlineInfo } from '../utils/tracker';

export function PriorityBadge({ priority = 'Medium' }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.Medium;
  return (
    <span className="tag" style={{ '--c': meta.color }} title={`${priority} priority`}>
      <i /> {priority}
    </span>
  );
}

export function DeadlineChip({ deadline, done = false }) {
  const info = deadlineInfo(deadline, done);
  if (!info) return <span className="tag tag-muted">No deadline</span>;
  return <span className={`tag tag-${info.tone}`} title={deadline}>⏱ {info.label}</span>;
}

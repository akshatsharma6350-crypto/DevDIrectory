import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AlertBanner from '../components/AlertBanner';
import { Donut, Gauge, Heatmap, LineChart, MiniBars, Ring, Sparkline } from '../components/Charts';
import ProjectCard from '../components/ProjectCard';
import SkeletonLoader from '../components/SkeletonLoader';
import UserCard from '../components/UserCard';
import { useAuth } from '../context/AuthContext';
import { useTracker } from '../context/TrackerContext';
import useFetch from '../hooks/useFetch';
import { getErrorMessage } from '../services/api';
import { getAllPosts } from '../services/postService';
import { listProjects } from '../services/projectService';
import { getUsers } from '../services/userService';
import { PRIORITIES, STATUS_LIST, STATUS_META, WEEKDAYS, buildTimeline, computeStats } from '../utils/tracker';

const RANGES = ['7D', '30D', '90D'];

function Kpi({ title, value, badge, tone = 'up', viz, to }) {
  return (
    <div className="kpi">
      <div className="kpi-main">
        <p className="kpi-title">{title}</p>
        <div className="kpi-row">
          <div>
            <strong className="kpi-value">{value}</strong>
            <span className={`delta ${tone}`}>{badge}</span>
          </div>
          <div className="kpi-viz">{viz}</div>
        </div>
      </div>
      <Link to={to} className="kpi-foot">See Details →</Link>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { tasks, getStatus } = useTracker();
  const [range, setRange] = useState('30D');

  const { data, loading, error, retry } = useFetch(async () => {
    const [users, posts, projects] = await Promise.all([getUsers(), getAllPosts(), listProjects({ sort: 'popular' })]);
    return { users, posts, projects };
  }, []);

  // Recomputed instantly whenever tasks or statuses change → real-time dashboard
  const stats = useMemo(
    () => (data ? computeStats({ tasks, users: data.users, projects: data.projects, statusOf: getStatus }) : null),
    [data, tasks, getStatus],
  );
  const timeline = useMemo(() => buildTimeline(tasks, range), [tasks, range]);
  const spark = useMemo(() => buildTimeline(tasks, '7D').created, [tasks]);

  const scoreText = !stats ? '' : stats.score >= 75
    ? 'The team is performing well above average, meeting or exceeding targets across most projects.'
    : stats.score >= 50
      ? 'The team is on track. A few overdue or high-priority tasks need attention.'
      : 'Delivery is behind plan. Review overdue tasks and rebalance the workload.';

  return (
    <div className="container page dash">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Employee & Project Tracking</span>
          <h1>{isAuthenticated ? `Welcome back, ${user.name.split(' ')[0]} 👋` : 'Engineering command centre'}</h1>
          <p className="muted">Live view of your team, their tasks and every project in the Store.</p>
        </div>
        <div className="head-actions">
          <Link to="/users" className="btn btn-ghost">Manage employees</Link>
          <Link to="/projects" className="btn btn-primary">Open Project Store</Link>
        </div>
      </header>

      {error && <AlertBanner title="Could not load platform data" onRetry={retry}>{getErrorMessage(error)}</AlertBanner>}
      {loading && <><SkeletonLoader variant="stats" /><div style={{ marginTop: '1rem' }}><SkeletonLoader variant="project" count={2} /></div></>}

      {stats && (
        <>
          <section className="kpi-panel" aria-label="Key metrics">
            <Kpi title="Total Employees" value={stats.employees} badge={`${stats.statusCounts['On Leave']} on leave`} tone={stats.statusCounts['On Leave'] ? 'warn' : 'up'} viz={<MiniBars values={stats.workload} label="Open tasks per employee" />} to="/users" />
            <Kpi title="Active Projects" value={stats.activeProjects} badge={`${stats.highPriority} high priority`} tone={stats.highPriority ? 'warn' : 'up'} viz={<Sparkline values={spark} />} to="/projects" />
            <Kpi title="Completed Tasks" value={stats.done} badge={`↑ ${stats.completion}% done`} viz={<Ring percent={stats.completion} />} to="/users" />
            <Kpi title="Overdue Tasks" value={stats.overdue} badge={stats.overdue ? '↓ needs action' : '✓ all clear'} tone={stats.overdue ? 'down' : 'up'} viz={<MiniBars values={stats.dueNext} label="Tasks due in the next 5 days" />} to="/users" />
          </section>

          <section className="dash-row dash-row-a">
            <div className="card gauge-card">
              <Gauge value={stats.score} />
              <p className="gauge-label">TEAM SCORE</p>
              <p className="muted small">{scoreText}</p>
              <p className="muted tiny" title="Completed tasks + half-credit for in-progress, minus 5 points per overdue task">How is this calculated?</p>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <span className="muted small">Statistics</span>
                  <h2 className="card-title">Task analytics</h2>
                </div>
                <div className="legend">
                  <span><i style={{ background: 'var(--gold)' }} /> Created</span>
                  <span><i style={{ background: 'var(--text)' }} /> Completed</span>
                </div>
                <div className="segmented" role="group" aria-label="Time range">
                  {RANGES.map((r) => <button key={r} type="button" className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}</button>)}
                </div>
              </div>
              <LineChart labels={timeline.labels} series={[{ name: 'Created', color: 'var(--gold)', values: timeline.created }, { name: 'Completed', color: 'var(--text)', values: timeline.completed }]} />
            </div>
          </section>

          <section className="dash-row dash-row-b">
            <div className="card">
              <div className="card-head">
                <div><h2 className="card-title">Deadlines by weekday</h2><p className="muted small">Open tasks due, split by priority</p></div>
              </div>
              <Heatmap rows={PRIORITIES} cols={WEEKDAYS} data={stats.matrix} />
            </div>

            <div className="card donut-card">
              <div>
                <h2 className="card-title">Team availability</h2>
                <p className="muted small">{data.posts.length} publications · {stats.totalTasks} tracked tasks</p>
                <ul className="donut-legend">
                  {STATUS_LIST.map((s) => (
                    <li key={s}><i style={{ background: STATUS_META[s].color }} /><span>{s}</span><strong>{stats.statusCounts[s]}</strong></li>
                  ))}
                </ul>
              </div>
              <Donut total={stats.employees} slices={STATUS_LIST.map((s) => ({ label: s, value: stats.statusCounts[s], color: STATUS_META[s].color }))} />
            </div>
          </section>

          <section className="section">
            <div className="section-head"><h2>Trending in the Store</h2><Link to="/projects" className="link">See all →</Link></div>
            <div className="grid">{data.projects.slice(0, 3).map((p) => <ProjectCard key={p.id} project={p} />)}</div>
          </section>

          <section className="section">
            <div className="section-head"><h2>Meet the team</h2><Link to="/users" className="link">Full directory →</Link></div>
            <div className="grid grid-4">{data.users.slice(0, 4).map((u) => <UserCard key={u.id} user={u} />)}</div>
          </section>
        </>
      )}
    </div>
  );
}

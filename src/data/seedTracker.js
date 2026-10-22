/** Demo tasks + statuses so the dashboard has real-looking data on first launch.
 *  Dates are relative to "today", so the charts always look current. */
const DAY = 86400000;
const iso = (offset) => new Date(Date.now() + offset * DAY).toISOString();
const ymd = (offset) => {
  const d = new Date(Date.now() + offset * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

let n = 0;
// userId, title, status, priority, due (days from today), created (days ago), done (days ago), projectId
const t = (userId, title, status, priority, due, created, done, projectId = '') => ({
  id: `seed-${(n += 1)}`, userId, title, status, priority,
  deadline: due === null ? '' : ymd(due), projectId,
  createdAt: iso(-created), completedAt: done === null ? null : iso(-done),
});

export const seedTasks = () => {
  n = 0;
  return [
    t(1, 'Quarterly roadmap review', 'progress', 'High', 3, 12, null, 'devdirectory-core'),
    t(1, 'Hire frontend intern', 'todo', 'Medium', 9, 5, null),
    t(1, 'Sprint retrospective deck', 'done', 'Low', -4, 25, 6, 'devdirectory-core'),
    t(2, 'Build accessible modal component', 'done', 'High', -10, 28, 12, 'devdirectory-core'),
    t(2, 'Audit colour contrast', 'done', 'Medium', 2, 9, 1, 'news-reader'),
    t(2, 'Headline card redesign', 'todo', 'Low', 12, 3, null, 'news-reader'),
    t(2, 'Storybook documentation', 'done', 'Low', -1, 13, 2),
    t(3, 'Todo sync API endpoint', 'progress', 'High', -1, 15, null, 'todo-app'),
    t(3, 'Fix flaky CI tests', 'done', 'Medium', -6, 20, 9),
    t(3, 'Priority filter for TaskFlow', 'todo', 'Medium', 5, 2, null, 'todo-app'),
    t(4, 'Design system tokens v2', 'done', 'High', -14, 30, 16, 'devdirectory-core'),
    t(4, 'Dark mode QA pass', 'todo', 'Medium', 0, 4, null, 'devdirectory-core'),
    t(5, 'Rate-limit middleware', 'done', 'High', 4, 11, 2),
    t(5, 'Load test news API', 'todo', 'Low', 15, 1, null, 'news-reader'),
    t(5, 'Upgrade Node runtime', 'done', 'Medium', -2, 18, 3),
    t(6, 'Terraform staging cluster', 'done', 'High', -8, 26, 10),
    t(6, 'Alerting runbook', 'done', 'Medium', 6, 7, 1),
    t(7, 'Offline mode for mobile app', 'todo', 'High', -3, 14, null),
    t(7, 'Push notification spike', 'done', 'Low', -5, 22, 7),
    t(8, 'Event pipeline dashboards', 'done', 'Medium', 7, 8, 4),
    t(8, 'Backfill analytics tables', 'done', 'High', -9, 27, 11),
    t(9, 'OAuth token rotation review', 'done', 'High', 1, 6, 0, 'devdirectory-core'),
    t(9, 'Penetration-test report', 'done', 'Medium', -12, 29, 14),
    t(10, 'Playwright smoke suite', 'done', 'Medium', -7, 21, 8, 'todo-app'),
    t(10, 'Regression pack for news app', 'todo', 'High', 8, 2, null, 'news-reader'),
  ];
};

export const seedStatuses = () => ({
  1: 'Active', 2: 'In Meeting', 3: 'Active', 4: 'On Leave', 5: 'Active',
  6: 'In Meeting', 7: 'Active', 8: 'Active', 9: 'On Leave', 10: 'Active',
});

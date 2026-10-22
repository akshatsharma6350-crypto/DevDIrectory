/**
 * JSONPlaceholder returns its 100 posts as Latin "lorem ipsum". The API stays the
 * source of truth for ids and authors; this file supplies readable English
 * titles + bodies for each of those posts (10 per developer, matching their role).
 */
const TITLES = [
  // 1 — Aarav Sharma · Engineering Manager
  ['How we run effective weekly sprint reviews', 'Building a hiring bar for frontend engineers', 'Lessons from migrating to a monorepo', 'Writing engineering roadmaps people actually read', 'Giving feedback that engineers can act on', 'Reducing meeting load without losing alignment', 'A practical guide to on-call rotations', 'Setting quarterly goals for platform teams', 'Onboarding new developers in their first 30 days', 'Making architecture decision records a habit'],
  // 2 — Ananya Iyer · Senior Frontend Engineer
  ['Accessible modals and focus management in React', 'Reducing bundle size with route-level code splitting', 'Why we adopted TypeScript for the component library', 'Keyboard navigation patterns every dropdown needs', 'Measuring Core Web Vitals in production', 'Testing React components with user-centric queries', 'Managing server state with caching and revalidation', 'Designing form validation that feels helpful', 'Colour contrast checks in our design workflow', 'Optimising long lists with virtualisation'],
  // 3 — Rohan Mehta · Full-Stack Developer
  ['Designing REST endpoints that age gracefully', 'Connection pooling lessons from PostgreSQL', 'Taming flaky tests in our CI pipeline', 'Structuring a Node.js service for maintainability', 'Caching strategies for read-heavy dashboards', 'Handling file uploads safely in Express', 'Database migrations without downtime', 'Adding rate limiting to public APIs', 'Logging and tracing across full-stack features', 'From prototype to production: a feature checklist'],
  // 4 — Priya Nair · UI/UX Engineer
  ['Building a design token system from scratch', 'Dark mode done right: contrast, depth and colour', 'Spacing scales that keep interfaces consistent', 'Motion principles for subtle, purposeful interfaces', 'Documenting components so designers use them', 'Typography choices for dense dashboards', 'Running quick usability tests with small teams', 'Empty states that guide instead of confuse', 'Designing for slow networks and small screens', 'Auditing our UI for visual consistency'],
  // 5 — Vikram Singh Rathore · Backend Architect
  ['Event-driven design with Kafka in practice', 'Splitting a monolith without breaking customers', 'Idempotency keys for safe payment retries', 'Choosing between REST, GraphQL and gRPC', 'Circuit breakers and graceful degradation', 'Profiling Go services under heavy load', 'Designing schemas for multi-tenant systems', 'Versioning internal APIs across many teams', 'Capacity planning for seasonal traffic spikes', 'Observability checklist for new microservices'],
  // 6 — Sneha Kulkarni · DevOps Engineer
  ['Zero-downtime deployments on Kubernetes', 'Infrastructure as code with Terraform modules', 'Cutting our cloud bill by right-sizing workloads', 'Building alerts that page people only when needed', 'Secrets management across staging and production', 'Designing CI pipelines that finish in minutes', 'Disaster recovery drills for small teams', 'Autoscaling policies we learned the hard way', 'Container image hygiene and vulnerability scanning', 'Writing runbooks that people actually follow'],
  // 7 — Arjun Reddy · Mobile Engineer
  ['Offline-first architecture for mobile apps', 'Smooth list scrolling in React Native', 'Push notifications without annoying users', 'Deep links and navigation in cross-platform apps', 'Reducing app startup time on low-end phones', 'Handling flaky networks with retry and backoff', 'Sharing business logic between iOS and Android', 'Secure local storage on mobile devices', 'Releasing mobile updates with staged rollouts', 'Crash reporting that leads to real fixes'],
  // 8 — Kavya Menon · Data Engineer
  ['Building reliable data pipelines with Spark', 'Modelling analytics tables with dbt', 'Detecting data quality issues before dashboards break', 'Backfilling historical data safely', 'Choosing between batch and streaming', 'Partitioning strategies for large event tables', 'Designing metrics that teams can trust', 'Cost-aware queries in the data warehouse', 'Documenting datasets for self-serve analytics', 'Monitoring pipeline freshness and failures'],
  // 9 — Ishaan Gupta · Security Engineer
  ['Threat modelling a new feature in one hour', 'OAuth 2.0 pitfalls that lead to account takeovers', 'Rotating secrets and tokens without outages', 'Preventing XSS in modern frontend frameworks', 'Security reviews that developers do not dread', 'Dependency scanning and supply-chain safety', 'Validating file uploads the safe way', 'Password storage and credential hygiene', 'Logging security events without leaking data', 'Running a lightweight bug bounty programme'],
  // 10 — Diya Banerjee · QA Automation Lead
  ['Building a stable end-to-end test suite', 'Choosing what to automate and what to test manually', 'Playwright tips for fast, reliable browser tests', 'Test data strategies for shared environments', 'Visual regression testing without the noise', 'Shifting quality left in the delivery pipeline', 'Measuring test coverage that actually matters', 'Contract testing between frontend and backend', 'Reproducing bugs with clear, minimal steps', 'Release checklists that prevent last-minute surprises'],
];

const LEADS = [
  (t) => `This bulletin, “${t}”, shares practical lessons from our recent work.`,
  (t) => `Here is a short write-up titled “${t}”, based on what our team has learned.`,
  (t) => `We have been working on this topic, and “${t}” captures the key takeaways.`,
  (t) => `“${t}” is a quick guide written for engineers across all of our teams.`,
  (t) => `In “${t}”, we document what worked, what did not and what we would do differently.`,
  (t) => `The note “${t}” summarises our experience and recommendations.`,
];
const DETAILS = [
  'It covers the problem we faced, the options we considered and the approach that worked best for us.',
  'The write-up includes concrete examples, common mistakes to avoid and a short checklist you can reuse.',
  'Our goal was to keep the solution simple, well documented and easy for new developers to adopt.',
  'We measured the results before and after the change so the impact is clear and easy to verify.',
  'Feedback from reviewers shaped the final approach, and their suggestions are included in the notes.',
  'The guidance applies to most of our projects and can be adapted as the codebase grows.',
];
const CLOSES = [
  'Please share questions or suggestions in the team channel.',
  'Feel free to reach out if you would like a walkthrough.',
  'We will update this note as we learn more.',
  'Reviews and improvements are always welcome.',
];

/** Replaces a Latin API post's text with English, keeping id / userId untouched. */
export function localisePost(post) {
  const user = Math.min(Math.max(Math.ceil(post.id / 10), 1), 10);
  const index = (post.id - 1) % 10;
  const title = TITLES[user - 1]?.[index];
  if (!title) return post; // unknown post: leave as-is
  return {
    ...post,
    title,
    body: [LEADS[post.id % LEADS.length](title), DETAILS[(post.id * 3) % DETAILS.length], CLOSES[post.id % CLOSES.length]].join(' '),
  };
}

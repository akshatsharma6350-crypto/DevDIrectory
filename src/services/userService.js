import apiClient from './api';

/**
 * JSONPlaceholder ships with western placeholder names. The portal keeps the
 * live API as the source of truth (ids, contact, ordering) and layers an
 * Indian engineering-team profile on top of each record.
 */
const PROFILES = {
  1: { name: 'Aarav Sharma', city: 'Bengaluru', role: 'Engineering Manager', company: 'Kaveri Systems', phone: '+91 98450 11201', skills: ['React', 'System Design', 'Leadership'], exp: 11, bio: 'Leads platform engineering and mentors the frontend guild. Loves clean architecture and chai-fuelled design reviews.' },
  2: { name: 'Ananya Iyer', city: 'Chennai', role: 'Senior Frontend Engineer', company: 'Nilgiri Labs', phone: '+91 98400 22312', skills: ['React', 'TypeScript', 'Accessibility'], exp: 7, bio: 'Champions accessible, performant interfaces and maintains the shared component library.' },
  3: { name: 'Rohan Mehta', city: 'Mumbai', role: 'Full-Stack Developer', company: 'Surya Cloudworks', phone: '+91 98200 33423', skills: ['Node.js', 'PostgreSQL', 'React'], exp: 5, bio: 'Builds product features end to end and keeps the CI pipelines green.' },
  4: { name: 'Priya Nair', city: 'Kochi', role: 'UI/UX Engineer', company: 'Ganga Digital', phone: '+91 98470 44534', skills: ['Design Systems', 'CSS', 'Figma'], exp: 6, bio: 'Bridges design and engineering with pixel-perfect, motion-aware interfaces.' },
  5: { name: 'Vikram Singh Rathore', city: 'Jaipur', role: 'Backend Architect', company: 'Himalaya Soft', phone: '+91 94140 55645', skills: ['Microservices', 'Go', 'Kafka'], exp: 13, bio: 'Designs resilient services that scale to millions of requests without drama.' },
  6: { name: 'Sneha Kulkarni', city: 'Pune', role: 'DevOps Engineer', company: 'Chakra Analytics', phone: '+91 98220 66756', skills: ['Kubernetes', 'Terraform', 'AWS'], exp: 8, bio: 'Automates everything that can be automated and monitors everything that cannot.' },
  7: { name: 'Arjun Reddy', city: 'Hyderabad', role: 'Mobile Engineer', company: 'Aryabhata Labs', phone: '+91 98480 77867', skills: ['React Native', 'Kotlin', 'GraphQL'], exp: 6, bio: 'Ships polished mobile experiences for the next billion users.' },
  8: { name: 'Kavya Menon', city: 'Thiruvananthapuram', role: 'Data Engineer', company: 'Brahma Compute', phone: '+91 94470 88978', skills: ['Python', 'Spark', 'dbt'], exp: 5, bio: 'Turns messy event streams into trustworthy dashboards.' },
  9: { name: 'Ishaan Gupta', city: 'Delhi NCR', role: 'Security Engineer', company: 'Indus Interactive', phone: '+91 98100 99089', skills: ['AppSec', 'OAuth', 'Threat Modelling'], exp: 9, bio: 'Hunts vulnerabilities before anyone else does and teaches teams to do the same.' },
  10: { name: 'Diya Banerjee', city: 'Kolkata', role: 'QA Automation Lead', company: 'Sagar Networks', phone: '+91 98300 10190', skills: ['Playwright', 'Cypress', 'CI/CD'], exp: 8, bio: 'Builds test suites that catch regressions long before customers do.' },
};

const slug = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/);

function enrich(raw) {
  const p = PROFILES[raw.id];
  if (!p) return { ...raw, apiName: raw.name, city: raw.address?.city || '—', role: 'Software Engineer', skills: [], exp: 3, bio: '', company: raw.company?.name || '—' };
  const parts = slug(p.name);
  return {
    id: raw.id,
    apiName: raw.name, // original API value — still searchable
    username: raw.username,
    name: p.name,
    email: `${parts[0]}.${parts[parts.length - 1]}@devdirectory.in`,
    phone: p.phone,
    website: raw.website,
    city: p.city,
    role: p.role,
    company: p.company,
    skills: p.skills,
    exp: p.exp,
    bio: p.bio,
  };
}

export async function getUsers() {
  const { data } = await apiClient.get('/users');
  return data.map(enrich);
}

export async function getUserById(id) {
  const { data } = await apiClient.get(`/users/${id}`);
  return enrich(data);
}

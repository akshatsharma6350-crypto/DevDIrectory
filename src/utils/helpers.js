import { BACKEND_URL } from '../services/api';

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const GRADIENTS = [
  ['#f3d58f', '#c8923a'], ['#8ab4ff', '#5b6cff'], ['#7ee0b5', '#2fa37a'], ['#ffb199', '#ff6a6a'],
  ['#d3a6ff', '#8f5bff'], ['#ffd36e', '#ff9a3c'], ['#7fe3f0', '#3aa6c9'], ['#f7a8d6', '#d6559b'],
];
export const gradientFor = (seed) => {
  const n = typeof seed === 'number' ? seed : [...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [a, b] = GRADIENTS[n % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const compact = (n) => new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(n);

/** Backend-hosted builds live at /apps/... — prefix them with the API origin. */
export const resolveLaunchUrl = (url = '') => (url.startsWith('/apps/') ? `${BACKEND_URL}${url}` : url);

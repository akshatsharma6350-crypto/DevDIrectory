import { backendClient, isNetworkError } from './api';

/**
 * Signs in against the Express backend (JWT). If the backend is not running,
 * falls back to the mock session the lab spec asks for, so the app always works.
 */
export async function signIn({ email, password }) {
  try {
    const { data } = await backendClient.post('/auth/login', { email, password });
    return { ...data.user, token: data.token, mode: 'backend' };
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const local = email.split('@')[0].replace(/[._]/g, ' ');
    const name = local.replace(/\b\w/g, (c) => c.toUpperCase());
    return { id: `mock-${Date.now()}`, name, email, role: 'Guest Engineer', token: `mock-token-${Date.now()}`, mode: 'mock' };
  }
}

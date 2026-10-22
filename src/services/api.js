import axios from 'axios';

/**
 * Single, centrally configured Axios client for the public REST API (per spec).
 * Every view talks to the network ONLY through the services in this folder.
 */
const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios client for the DevDirectory Express backend (project store + auth).
 */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const backendClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 8000,
});

backendClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Turns any Axios error into a friendly, human-readable sentence. */
export function getErrorMessage(error) {
  if (error?.response) {
    const { status, data } = error.response;
    if (data?.message) return data.message;
    if (status === 404) return 'We could not find what you were looking for (404).';
    if (status >= 500) return `The server had a problem (${status}). Please try again.`;
    return `Request failed with status ${status}.`;
  }
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Check your connection and retry.';
  if (error?.request) return 'Network error — the server could not be reached.';
  return error?.message || 'Something went wrong.';
}

/** True when the failure is "server unreachable" rather than an HTTP error. */
export const isNetworkError = (error) => !error?.response;

export default apiClient;

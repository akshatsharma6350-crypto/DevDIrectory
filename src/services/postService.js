import { localisePost } from '../data/englishPosts';
import apiClient from './api';

const LOCAL_KEY = 'dd_local_posts';

/** JSONPlaceholder accepts POSTs but never stores them, so we keep a local mirror
 *  to let authors see what they just published on their profile. */
const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
};

export async function getPosts() {
  const { data } = await apiClient.get('/posts');
  return data.map(localisePost); // API returns Latin lorem ipsum → show English
}

/** API posts + posts saved in localStorage (newest first). */
export async function getAllPosts() {
  const api = await getPosts();
  return [...readLocal(), ...api];
}

/** Removes a post that was created locally. (API posts are read-only.) */
export function deleteLocalPost(id) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(readLocal().filter((p) => p.id !== id)));
  } catch {
    /* ignore */
  }
}

export async function getPostsByUser(userId) {
  const { data: raw } = await apiClient.get('/posts', { params: { userId } });
  const data = raw.map(localisePost);
  const mine = readLocal().filter((p) => Number(p.userId) === Number(userId));
  return [...mine, ...data];
}

export function getLocalPostCount() {
  return readLocal().length;
}

/** Sends { title, body, userId } and verifies the API answered 201 Created. */
export async function createPost({ title, body, userId }) {
  const response = await apiClient.post('/posts', { title, body, userId: Number(userId) });
  if (response.status !== 201) {
    throw new Error(`Unexpected response status ${response.status}`);
  }
  const saved = { ...response.data, id: `local-${Date.now()}`, local: true, createdAt: new Date().toISOString() };
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([saved, ...readLocal()]));
  } catch {
    /* storage unavailable — the API call already succeeded */
  }
  return { status: response.status, post: saved };
}

import { useEffect, useMemo, useRef, useState } from 'react';
import AlertBanner from '../components/AlertBanner';
import SkeletonLoader from '../components/SkeletonLoader';
import UserCard from '../components/UserCard';
import { useTracker } from '../context/TrackerContext';
import useDebounce from '../hooks/useDebounce';
import useFetch from '../hooks/useFetch';
import useLocalStorage from '../hooks/useLocalStorage';
import { getErrorMessage } from '../services/api';
import { getUsers } from '../services/userService';
import { STATUS_LIST } from '../utils/tracker';

const ALL = 'All';

export default function UserDirectory() {
  const { data: users, loading, error, retry } = useFetch(getUsers, []);
  const { getStatus } = useTracker();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ company: ALL, stack: ALL, status: ALL, city: ALL });
  const [sort, setSort] = useState('name');
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useLocalStorage('dd_saved_devs', []);
  const debounced = useDebounce(query, 250);
  const inputRef = useRef(null);

  // "/" focuses the search box
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const options = useMemo(() => {
    const list = users || [];
    const uniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));
    return { company: uniq(list.map((u) => u.company)), stack: uniq(list.flatMap((u) => u.skills)), city: uniq(list.map((u) => u.city)) };
  }, [users]);

  const results = useMemo(() => {
    if (!users) return [];
    const q = debounced.trim().toLowerCase();
    return users
      .filter((u) => filters.company === ALL || u.company === filters.company)
      .filter((u) => filters.stack === ALL || u.skills.includes(filters.stack))
      .filter((u) => filters.city === ALL || u.city === filters.city)
      .filter((u) => filters.status === ALL || getStatus(u.id) === filters.status)
      .filter((u) => !savedOnly || saved.includes(u.id))
      // real-time search against name (incl. the API's original name) or company
      .filter((u) => !q || [u.name, u.apiName, u.company].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => (sort === 'company' ? a.company.localeCompare(b.company) : sort === 'city' ? a.city.localeCompare(b.city) : sort === 'exp' ? b.exp - a.exp : a.name.localeCompare(b.name)));
  }, [users, debounced, filters, savedOnly, saved, sort, getStatus]);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const activeCount = Object.values(filters).filter((v) => v !== ALL).length + (savedOnly ? 1 : 0) + (query ? 1 : 0);
  const reset = () => { setQuery(''); setFilters({ company: ALL, stack: ALL, status: ALL, city: ALL }); setSavedOnly(false); };
  const toggleSave = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="container page">
      <header className="page-head">
        <span className="eyebrow">Employees</span>
        <h1>Team directory</h1>
        <p className="muted">Search by name or company, then narrow down by tech stack, status or city. Press <kbd>/</kbd> to jump to search.</p>
      </header>

      <div className="toolbar">
        <div className="search">
          <span aria-hidden="true">🔍</span>
          <input ref={inputRef} type="search" placeholder="Search by name or company…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search developers" />
          {query && <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => setQuery('')}>×</button>}
        </div>
        <button type="button" className={`btn btn-sm ${savedOnly ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={savedOnly} onClick={() => setSavedOnly((v) => !v)}>
          ★ Saved ({saved.length})
        </button>
      </div>

      <div className="filter-bar" role="group" aria-label="Advanced filters">
        <label><span>Company</span>
          <select value={filters.company} onChange={setFilter('company')}><option>{ALL}</option>{options.company.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label><span>Tech stack</span>
          <select value={filters.stack} onChange={setFilter('stack')}><option>{ALL}</option>{options.stack.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label><span>Status</span>
          <select value={filters.status} onChange={setFilter('status')}><option>{ALL}</option>{STATUS_LIST.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label><span>City</span>
          <select value={filters.city} onChange={setFilter('city')}><option>{ALL}</option>{options.city.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label><span>Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Name</option><option value="company">Company</option><option value="city">City</option><option value="exp">Experience</option>
          </select>
        </label>
        {activeCount > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>Clear {activeCount} filter{activeCount > 1 ? 's' : ''}</button>}
      </div>

      {error && <AlertBanner title="Could not load developers" onRetry={retry}>{getErrorMessage(error)}</AlertBanner>}
      {loading && <SkeletonLoader count={8} />}

      {users && (
        <>
          <p className="muted small" aria-live="polite">{results.length} of {users.length} developers</p>
          {results.length ? (
            <div className="grid grid-4">
              {results.map((u) => <UserCard key={u.id} user={u} isSaved={saved.includes(u.id)} onToggleSave={toggleSave} />)}
            </div>
          ) : (
            <div className="empty">
              <span aria-hidden="true">🕵️</span>
              <h3>No developers match your filters</h3>
              <button className="btn btn-ghost" onClick={reset}>Reset filters</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

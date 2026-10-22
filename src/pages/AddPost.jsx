import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AlertBanner from '../components/AlertBanner';
import useFetch from '../hooks/useFetch';
import useLocalStorage from '../hooks/useLocalStorage';
import { getErrorMessage } from '../services/api';
import { createPost } from '../services/postService';
import { getUsers } from '../services/userService';

const LIMITS = { title: [5, 80], body: [20, 500] };
const EMPTY = { userId: '', title: '', body: '' };

function validate(v) {
  const e = {};
  if (!v.userId) e.userId = 'Choose an author.';
  const t = v.title.trim().length;
  if (t < LIMITS.title[0]) e.title = `Title needs at least ${LIMITS.title[0]} characters (${t}).`;
  else if (t > LIMITS.title[1]) e.title = `Title can be at most ${LIMITS.title[1]} characters.`;
  const b = v.body.trim().length;
  if (b < LIMITS.body[0]) e.body = `Content needs at least ${LIMITS.body[0]} characters (${b}).`;
  else if (b > LIMITS.body[1]) e.body = `Content can be at most ${LIMITS.body[1]} characters.`;
  return e;
}

export default function AddPost() {
  const users = useFetch(getUsers, []);
  const [draft, setDraft] = useLocalStorage('dd_post_draft', EMPTY); // autosaved draft
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { type, message }

  const values = draft;
  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const onChange = (e) => {
    setResult(null);
    setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));
  const show = (f) => touched[f] && errors[f];
  const author = users.data?.find((u) => String(u.id) === String(values.userId));

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ userId: true, title: true, body: true });
    if (!isValid || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const { status } = await toast.promise(
        createPost({ title: values.title.trim(), body: values.body.trim(), userId: values.userId }),
        {
          loading: 'Publishing bulletin…',
          success: 'Published & saved on this device ✨',
          error: (err) => getErrorMessage(err),
        },
      );
      if (status === 201) {
        setResult({ type: 'success', message: `“${values.title.trim()}” was published successfully (201 Created).`, authorId: values.userId });
        setDraft(EMPTY);
        setTouched({});
      }
    } catch (err) {
      setResult({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page">
      <header className="page-head">
        <span className="eyebrow">Publish</span>
        <h1>New team bulletin</h1>
        <p className="muted">Share documentation, release notes or learnings. Your draft is saved automatically.</p>
      </header>

      {result?.type === 'success' && (
        <AlertBanner variant="success" title="Published!">
          {result.message} <Link className="link" to={`/users/${result.authorId}`}>View on profile →</Link>
        </AlertBanner>
      )}
      {result?.type === 'error' && <AlertBanner variant="error" title="Could not publish" onRetry={() => submit({ preventDefault() {} })}>{result.message}</AlertBanner>}
      {users.error && <AlertBanner title="Could not load authors" onRetry={users.retry}>{getErrorMessage(users.error)}</AlertBanner>}

      <div className="split">
        <form className="card form" onSubmit={submit} noValidate>
          <label className="field">
            <span>Author</span>
            <select name="userId" value={values.userId} onChange={onChange} onBlur={onBlur} disabled={users.loading} className={show('userId') ? 'invalid' : ''}>
              <option value="">{users.loading ? 'Loading developers…' : 'Select an author'}</option>
              {users.data?.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
            </select>
            {show('userId') && <small className="error-text">{errors.userId}</small>}
          </label>

          <label className="field">
            <span>Title</span>
            <input name="title" type="text" value={values.title} onChange={onChange} onBlur={onBlur} placeholder="e.g. Migrating our design system to CSS variables" className={show('title') ? 'invalid' : ''} />
            <div className="field-foot">
              {show('title') ? <small className="error-text">{errors.title}</small> : <small />}
              <small className={`counter ${values.title.length > LIMITS.title[1] ? 'over' : ''}`}>{values.title.length}/{LIMITS.title[1]}</small>
            </div>
          </label>

          <label className="field">
            <span>Body content</span>
            <textarea name="body" rows="8" value={values.body} onChange={onChange} onBlur={onBlur} placeholder="Write the details…" className={show('body') ? 'invalid' : ''} />
            <div className="field-foot">
              {show('body') ? <small className="error-text">{errors.body}</small> : <small />}
              <small className={`counter ${values.body.length > LIMITS.body[1] ? 'over' : ''}`}>{values.body.length}/{LIMITS.body[1]}</small>
            </div>
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={!isValid || submitting}>{submitting ? 'Publishing…' : 'Publish bulletin'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setDraft(EMPTY); setTouched({}); }}>Clear draft</button>
          </div>
        </form>

        <aside className="card preview" aria-label="Live preview">
          <span className="eyebrow">Live preview</span>
          <h3>{values.title.trim() || 'Your title appears here'}</h3>
          <p className="muted small">{author ? `By ${author.name} · ${author.company}` : 'Pick an author'}</p>
          <p>{values.body.trim() || 'Start typing the body and watch it render here.'}</p>
        </aside>
      </div>
    </div>
  );
}

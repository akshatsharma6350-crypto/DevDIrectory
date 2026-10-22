import toast from 'react-hot-toast';

/** Replacement for window.confirm(): shows a toast with Cancel / Confirm buttons.
 *  Usage:  if (await confirmToast('Delete this?')) { ... } */
export default function confirmToast(message, { confirmLabel = 'Delete' } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value, id) => {
      if (settled) return;
      settled = true;
      toast.dismiss(id);
      resolve(value);
    };
    const id = toast.custom(
      (t) => (
        <div className="confirm-toast" role="alertdialog" aria-label={message} style={{ opacity: t.visible ? 1 : 0 }}>
          <p>{message}</p>
          <div className="confirm-actions">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => finish(false, t.id)}>Cancel</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => finish(true, t.id)}>{confirmLabel}</button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
    setTimeout(() => finish(false, id), 15000); // auto-cancel if ignored
  });
}

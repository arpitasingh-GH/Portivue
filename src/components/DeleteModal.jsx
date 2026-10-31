import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DeleteModal({ entry, onConfirm, onCancel, deleting = false }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !deleting) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, deleting]);

  if (!entry) return null;

  return (
    <div
      className="modal-backdrop-blur"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !deleting) onCancel();
      }}
    >
      <div className="modal-dialog-panel delete-modal-size" role="alertdialog" aria-modal="true">
        <div className="delete-modal-icon-wrap">
          <Trash2 size={24} className="delete-warning-icon" />
        </div>

        <div className="delete-modal-content">
          <h3 className="delete-modal-title">Delete Entry</h3>
          <p className="delete-modal-desc">
            Are you sure you want to permanently remove <strong>“{entry.title}”</strong> from your portfolio? This action cannot be undone.
          </p>
        </div>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => onConfirm(entry)}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

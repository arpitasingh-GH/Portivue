import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const Icon = type === "error" ? AlertCircle : type === "info" ? Info : CheckCircle2;

  return (
    <aside aria-label="Notification" className={`toast-notification ${type}`}>
      <div className="toast-icon">
        <Icon size={18} />
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </aside>
  );
}

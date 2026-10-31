import React from "react";
import { Sparkles } from "lucide-react";

export default function Brand({ onClick, size = "default", className = "" }) {
  return (
    <button
      className={`brand-container ${size} ${className}`}
      onClick={onClick}
      type="button"
      aria-label="Portivue home"
    >
      <div className="brand-mark">
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
        <span className="dot dot-4" />
      </div>
      <span className="brand-text">
        Porti<span className="brand-accent">vue</span>
      </span>
    </button>
  );
}

import React, { useState, useEffect } from "react";
import { X, ArrowUpRight, ShieldCheck, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../supabase";
import Brand from "./Brand";

export default function AuthModal({ mode = "signin", setMode, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !busy) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, busy]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          "Supabase credentials are not configured in .env.local. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
        );
      }

      if (mode === "signup") {
        const trimmedName = name.trim();
        if (!trimmedName) {
          throw new Error("Please enter your full name.");
        }

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: trimmedName }
          }
        });

        if (signUpErr) throw signUpErr;

        if (!data.session) {
          setMessage(
            "Account created! Please check your inbox to confirm your email, then log in."
          );
        } else {
          onSuccess(data.session.user);
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInErr) throw signInErr;
        onSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop-blur"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal-dialog-panel auth-modal-size" role="dialog" aria-modal="true">
        <button
          type="button"
          className="modal-close-icon-btn"
          onClick={onClose}
          disabled={busy}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="auth-brand-center">
          <Brand size="default" />
        </div>

        <div className="auth-modal-header">
          <h2 className="modal-title">
            {mode === "signup" ? "Create Your Portfolio" : "Welcome Back"}
          </h2>
          <p className="modal-subtitle">
            {mode === "signup"
              ? "Build an inspectable showcase of your projects and hackathons."
              : "Access your Portivue workspace and manage your portfolio."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-flow auth-form-flow">
          {error && (
            <div className="form-alert-banner error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="form-alert-banner success">
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          {mode === "signup" && (
            <div className="form-field-group">
              <label htmlFor="auth-name" className="field-label">
                Full Name <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <User size={16} className="input-left-icon" />
                <input
                  id="auth-name"
                  type="text"
                  className="styled-text-input has-icon"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  maxLength={80}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-field-group">
            <label htmlFor="auth-email" className="field-label">
              Email Address <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <Mail size={16} className="input-left-icon" />
              <input
                id="auth-email"
                type="email"
                className="styled-text-input has-icon"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-field-group">
            <label htmlFor="auth-password" className="field-label">
              Password <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <Lock size={16} className="input-left-icon" />
              <input
                id="auth-password"
                type="password"
                className="styled-text-input has-icon"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-full-width"
            disabled={busy}
          >
            {busy ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
            {!busy && <ArrowUpRight size={16} />}
          </button>
        </form>

        <div className="auth-modal-footer">
          <p className="auth-switch-prompt">
            {mode === "signup" ? "Already have an account?" : "New to Portivue?"}{" "}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError("");
                setMessage("");
              }}
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>

          <div className="auth-security-note">
            <ShieldCheck size={13} className="text-emerald" />
            <span>Secured with Supabase Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}

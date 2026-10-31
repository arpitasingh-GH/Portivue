import React, { useState, useEffect } from "react";
import { generateBio, suggestSkills } from "../lib/ai";
import { Spinner } from "./Spinner";
import { X, User, AtSign, FileText, Wrench, Sparkles, AlertCircle } from "lucide-react";

export default function ProfileModal({ profile, onSave, onCancel, saving = false }) {
  const [generatingBio, setGeneratingBio] = useState(false);
  const [generatingSkills, setGeneratingSkills] = useState(false);

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const result = await generateBio(form.bio);
      change('bio', result);
      alert('Bio generated');
    } catch (e) {
      alert('Failed to generate bio');
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSuggestSkills = async () => {
    setGeneratingSkills(true);
    try {
      const result = await suggestSkills(form.skillsInput);
      change('skillsInput', result);
      alert('Skills suggested');
    } catch (e) {
      alert('Failed to suggest skills');
    } finally {
      setGeneratingSkills(false);
    }
  };

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    skillsInput: (profile?.skills || []).join(", ")
  });
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !saving) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, saving]);

  const change = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const parsedSkills = form.skillsInput
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 30);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedName = form.full_name.trim();
    if (!trimmedName) {
      setError("Please provide your full name.");
      return;
    }

    const trimmedUsername = form.username.trim().toLowerCase();
    if (trimmedUsername) {
      if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(trimmedUsername)) {
        setError(
          "Username must be 3-30 characters long, start with a letter/number, and contain only lowercase letters, numbers, and hyphens."
        );
        return;
      }
    }

    onSave({
      full_name: trimmedName,
      username: trimmedUsername || profile?.username,
      bio: form.bio.trim(),
      skills: parsedSkills
    });
  }

  return (
    <div
      className="modal-backdrop-blur"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div className="modal-dialog-panel profile-modal-size" role="dialog" aria-modal="true">
        <div className="modal-header-row">
          <div>
            <div className="modal-badge-eyebrow">STUDENT PROFILE</div>
            <h2 className="modal-title">Edit Your Profile</h2>
            <p className="modal-subtitle">
              Your profile is visible on your public portfolio URL to recruiters and peers.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-flow">
          {error && (
            <div className="form-alert-banner error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="form-field-group">
            <label htmlFor="profile-name" className="field-label">
              Full Name <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <User size={16} className="input-left-icon" />
              <input
                id="profile-name"
                type="text"
                className="styled-text-input has-icon"
                value={form.full_name}
                onChange={e => change("full_name", e.target.value)}
                placeholder="e.g. Alex Morgan"
                maxLength={80}
                required
              />
              <button type="button" className="icon-button" onClick={handleGenerateBio} disabled={generatingBio || saving} style={{marginTop: '0.5rem'}}>
                <Sparkles size={16} className="icon-left" />
                {generatingBio ? <Spinner size="sm" /> : "✨ Generate Bio"}
              </button>
            </div>
          </div>

          {/* Username */}
          <div className="form-field-group">
            <div className="field-label-row">
              <label htmlFor="profile-username" className="field-label">
                Custom Handle / URL Slug
              </label>
              <span className="field-subnote">portivue.app/u/{form.username || "username"}</span>
            </div>
            <div className="input-with-icon">
              <AtSign size={16} className="input-left-icon" />
              <input
                id="profile-username"
                type="text"
                className="styled-text-input has-icon"
                value={form.username}
                onChange={e => change("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="alex-morgan"
                maxLength={30}
              />
              <button type="button" className="icon-button" onClick={handleGenerateBio} disabled={generatingBio || saving} style={{marginTop: '0.5rem'}}>
                <Sparkles size={16} className="icon-left" />
                {generatingBio ? <Spinner size="sm" /> : "✨ Generate Bio"}
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="form-field-group">
            <div className="field-label-row">
              <label htmlFor="profile-bio" className="field-label">
                Bio & Focus Areas
              </label>
              <span className="char-count">{form.bio.length}/600</span>
            </div>
            <textarea
              id="profile-bio"
              className="styled-textarea"
              rows={3}
              value={form.bio}
              onChange={e => change("bio", e.target.value)}
              placeholder="What are you currently learning, building, or aiming to work on?"
              maxLength={600}
            />
          </div>

          {/* Skills Input */}
          <div className="form-field-group">
            <div className="field-label-row">
              <label htmlFor="profile-skills" className="field-label">
                Skills & Technologies <span className="optional-tag">COMMA-SEPARATED</span>
              </label>
              <span className="char-count">{parsedSkills.length}/30 tags</span>
            </div>
            <div className="input-with-icon">
              <Wrench size={16} className="input-left-icon" />
              <input
                id="profile-skills"
                type="text"
                className="styled-text-input has-icon"
                value={form.skillsInput}
                onChange={e => change("skillsInput", e.target.value)}
                placeholder="React, TypeScript, Python, Machine Learning, Supabase"
              />
              <button type="button" className="icon-button" onClick={handleGenerateBio} disabled={generatingBio || saving} style={{marginTop: '0.5rem'}}>
                <Sparkles size={16} className="icon-left" />
                {generatingBio ? <Spinner size="sm" /> : "✨ Generate Bio"}
              </button>
            </div>

            {/* Live Tag Cloud Preview */}
            {parsedSkills.length > 0 && (
              <div className="modal-tag-preview-wrap">
                <span className="tag-preview-label">Live Preview:</span>
                <div className="skill-pills-row">
                  {parsedSkills.map(s => (
                    <span key={s} className="skill-badge-pill">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions-bar">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Saving profile..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

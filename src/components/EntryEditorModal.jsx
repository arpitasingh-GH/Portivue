import React, { useState, useEffect } from "react";
import { X, Code2, FileBadge, Trophy, Link2, ArrowUpRight, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Wrench } from "lucide-react";
import { generateProjectDescription, correctGrammar } from "../lib/ai";
import { Spinner } from "./Spinner";
import { normalizeUrl, safeUrl } from "../constants";

export default function EntryEditorModal({ initial, onSave, onCancel, saving = false }) {
  const isEditing = Boolean(initial?.id);
  const [form, setForm] = useState({
    title: initial?.title || "",
    entry_type: initial?.entry_type || "project",
    description: initial?.description || "",
    evidence_url: initial?.evidence_url || "",
    is_public: initial ? initial.is_public !== false : true
  });
  const [error, setError] = useState("");
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [fixingGrammar, setFixingGrammar] = useState(false);

  const handleGenerateDescription = async () => {
    setGeneratingDesc(true);
    try {
      const result = await generateProjectDescription(form.description);
      change('description', result);
      alert('Description generated');
    } catch (e) {
      alert('Failed to generate description');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleFixGrammar = async () => {
    setFixingGrammar(true);
    try {
      const result = await correctGrammar(form.description);
      change('description', result);
      alert('Grammar corrected');
    } catch (e) {
      alert('Failed to fix grammar');
    } finally {
      setFixingGrammar(false);
    }
  };

  // const [generatingDesc, setGeneratingDesc] = useState(false);
  // const [fixingGrammar, setFixingGrammar] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const change = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const hasEvidenceInput = Boolean(form.evidence_url.trim());

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setError("Please provide an entry title.");
      return;
    }
    if (trimmedTitle.length > 120) {
      setError("Title must be 120 characters or fewer.");
      return;
    }

    let finalEvidenceUrl = null;
    const trimmedEvidence = form.evidence_url.trim();
    if (trimmedEvidence) {
      const sanitized = normalizeUrl(trimmedEvidence);
      if (!safeUrl(sanitized)) {
        setError("Please enter a valid website URL (e.g. https://github.com/your-repo).");
        return;
      }
      finalEvidenceUrl = sanitized;
    }

    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      title: trimmedTitle,
      entry_type: form.entry_type,
      description: form.description.trim(),
      evidence_url: finalEvidenceUrl,
      is_public: form.is_public
    });
  }

  const types = [
    { value: "project", label: "Project", icon: Code2 },
    { value: "certificate", label: "Certificate", icon: FileBadge },
    { value: "hackathon", label: "Hackathon", icon: Trophy }
  ];

  return (
    <div
      className="modal-backdrop-blur"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div className="modal-dialog-panel entry-modal-size" role="dialog" aria-modal="true">
        <div className="modal-header-row">
          <div>
            <div className="modal-badge-eyebrow">PORTFOLIO WORKSPACE</div>
            <h2 className="modal-title">{isEditing ? "Edit Portfolio Entry" : "Add New Entry"}</h2>
            <p className="modal-subtitle">
              Show what you built or learned. Supporting evidence links are inspectable by visitors.
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

          {/* Type Selector Tabs */}
          <div className="form-field-group">
            <label className="field-label">Entry Category</label>
            <div className="segmented-type-selector">
              {types.map(t => {
                const Icon = t.icon;
                const active = form.entry_type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    className={`segment-btn ${active ? "active" : ""}`}
                    onClick={() => change("entry_type", t.value)}
                  >
                    <Icon size={15} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="form-field-group">
            <div className="field-label-row">
              <label htmlFor="entry-title" className="field-label">
                Entry Title <span className="required-star">*</span>
              </label>
              <span className="char-count">{form.title.length}/120</span>
            </div>
            <input
              id="entry-title"
              type="text"
              className="styled-text-input"
              value={form.title}
              onChange={e => change("title", e.target.value)}
              placeholder="e.g. StudyFlow — a calmer study planner"
              maxLength={120}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-field-group">
            <div className="field-label-row">
              <label htmlFor="entry-desc" className="field-label">
                Description & Outcomes
              </label>
              <span className="char-count">{form.description.length}/3000</span>
            </div>
            <textarea
              id="entry-desc"
              className="styled-textarea"
              rows={4}
              value={form.description}
              onChange={e => change("description", e.target.value)}
              placeholder="Describe your role, core technologies used, problem solved, and key learnings..."
              maxLength={3000}
            />
          </div>

          {/* Evidence URL */}
          <div className="form-field-group">
            <div className="field-label-row">
              <label htmlFor="entry-url" className="field-label">
                Evidence URL <span className="optional-tag">OPTIONAL</span>
              </label>
              <span className="url-preview-tag">
                {hasEvidenceInput ? (
                  <span className="preview-pill linked">
                    <CheckCircle2 size={11} /> Will be: Evidence linked
                  </span>
                ) : (
                  <span className="preview-pill self">
                    📋 Will be: Self-reported
                  </span>
                )}
              </span>
            </div>
            <div className="input-with-icon">
              <Link2 size={16} className="input-left-icon" />
              <input
                id="entry-url"
                type="text"
                className="styled-text-input has-icon"
                value={form.evidence_url}
                onChange={e => change("evidence_url", e.target.value)}
                placeholder="github.com/your-username/repo or coursera.org/verify/..."
              />
              <button type="button" className="icon-button" onClick={handleGenerateDescription} disabled={generatingDesc || saving} style={{marginTop: '0.5rem'}}>
                <Sparkles size={16} className="icon-left" />
                {generatingDesc ? <Spinner size="sm" /> : "✨ Generate Description"}
              </button>
              <button type="button" className="icon-button" onClick={handleFixGrammar} disabled={fixingGrammar || saving} style={{marginTop: '0.5rem'}}>
                <Wrench size={16} className="icon-left" />
                {fixingGrammar ? <Spinner size="sm" /> : "✨ Fix Grammar"}
              </button>
            </div>
            <p className="field-helper-text">
              <ShieldCheck size={13} />
              Evidence links allow reviewers to inspect code, live demos, or certificates. If left empty, the entry is labeled Self-reported.
            </p>
          </div>

          {/* Visibility Setting */}
          <div className="form-field-group">
            <label className="field-label">Visibility</label>
            <div className="visibility-toggle-group">
              <label className={`visibility-option ${form.is_public ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={form.is_public}
                  onChange={() => change("is_public", true)}
                />
              <button type="button" className="icon-button" onClick={handleGenerateDescription} disabled={generatingDesc || saving} style={{marginTop: '0.5rem'}}>
                <Sparkles size={16} className="icon-left" />
                {generatingDesc ? <Spinner size="sm" /> : "✨ Generate Description"}
              </button>
              <button type="button" className="icon-button" onClick={handleFixGrammar} disabled={fixingGrammar || saving} style={{marginTop: '0.5rem'}}>
                <Wrench size={16} className="icon-left" />
                {fixingGrammar ? <Spinner size="sm" /> : "✨ Fix Grammar"}
              </button>
                <div className="vis-info">
                  <strong>Public</strong>
                  <small>Visible on your public portfolio page</small>
                </div>
              </label>

              <label className={`visibility-option ${!form.is_public ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={!form.is_public}
                  onChange={() => change("is_public", false)}
                />
              <button type="button" className="icon-button" onClick={handleGenerateDescription} disabled={generatingDesc || saving} style={{marginTop: '0.5rem'}}>
                <Sparkles size={16} className="icon-left" />
                {generatingDesc ? <Spinner size="sm" /> : "✨ Generate Description"}
              </button>
              <button type="button" className="icon-button" onClick={handleFixGrammar} disabled={fixingGrammar || saving} style={{marginTop: '0.5rem'}}>
                <Wrench size={16} className="icon-left" />
                {fixingGrammar ? <Spinner size="sm" /> : "✨ Fix Grammar"}
              </button>
                <div className="vis-info">
                  <strong>Private (Draft)</strong>
                  <small>Only visible inside your private workspace</small>
                </div>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
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
              {saving ? "Saving entry..." : isEditing ? "Save Changes" : "Create Entry"}
              {!saving && <ArrowUpRight size={15} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

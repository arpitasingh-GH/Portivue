import React from "react";
import {
  ArrowUpRight,
  Code2,
  FileBadge,
  Trophy,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Globe
} from "lucide-react";
import { ENTRY_CONFIG, safeUrl, getDomain, dateLabel } from "../constants";

export default function EntryCard({
  entry,
  editable = false,
  onEdit,
  onDelete,
  onTogglePublic
}) {
  const config = ENTRY_CONFIG[entry.entry_type] || ENTRY_CONFIG.project;
  const Icon = config.icon;
  const link = safeUrl(entry.evidence_url);
  const hasEvidence = Boolean(link);
  const domain = link ? getDomain(link) : "";

  return (
    <article className="entry-card">
      <div className="entry-card-header">
        <div className="entry-type-pill" style={{ color: config.color, backgroundColor: config.bg }}>
          <Icon size={14} className="entry-type-icon" />
          <span>{config.label}</span>
        </div>

        <div className="entry-status-badges">
          {hasEvidence ? (
            <span className="badge-evidence linked" title="Verified evidence URL provided">
              <span className="status-dot-pulse" />
              <CheckCircle2 size={12} />
              <span>Evidence linked</span>
            </span>
          ) : (
            <span className="badge-evidence self" title="Self-reported record without link">
              <span className="status-dot-amber" />
              <span>Self-reported</span>
            </span>
          )}

          {editable && (
            <span
              className={`badge-visibility ${entry.is_public !== false ? "public" : "private"}`}
              title={entry.is_public !== false ? "Visible on public portfolio" : "Only visible to you"}
            >
              {entry.is_public !== false ? (
                <>
                  <Eye size={12} />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <EyeOff size={12} />
                  <span>Private</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="entry-body">
        <h3 className="entry-title">{entry.title}</h3>
        <p className="entry-description">{entry.description || "No description provided."}</p>
      </div>

      {link && (
        <div className="entry-evidence-link-wrap">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="evidence-action-link"
          >
            <Globe size={13} className="evidence-link-icon" />
            <span className="evidence-link-text">
              Inspect evidence <span className="evidence-domain">({domain})</span>
            </span>
            <ArrowUpRight size={14} className="arrow-icon" />
          </a>
        </div>
      )}

      <div className="entry-card-footer">
        <span className="entry-date">{dateLabel(entry.created_at)}</span>

        {editable && (
          <div className="entry-management-actions">
            <button
              type="button"
              className="action-btn-secondary"
              onClick={() => onTogglePublic(entry)}
              title={entry.is_public !== false ? "Make private" : "Make public"}
            >
              {entry.is_public !== false ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{entry.is_public !== false ? "Hide" : "Publish"}</span>
            </button>

            <button
              type="button"
              className="action-icon-btn edit"
              onClick={() => onEdit(entry)}
              title="Edit entry"
              aria-label="Edit entry"
            >
              <Edit3 size={15} />
            </button>

            <button
              type="button"
              className="action-icon-btn delete"
              onClick={() => onDelete(entry)}
              title="Delete entry"
              aria-label="Delete entry"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

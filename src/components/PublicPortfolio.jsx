import React, { useState } from "react";
import {
  Sparkles,
  Link2,
  Check,
  Globe,
  BriefcaseBusiness,
  ShieldCheck,
  ArrowUpRight,
  Code2,
  FileBadge,
  Trophy,
  Filter,
  ArrowLeft,
  Share2
} from "lucide-react";
import Brand from "./Brand";
import EntryCard from "./EntryCard";
import { initials } from "../constants";

export default function PublicPortfolio({
  profile,
  entries = [],
  sample = false,
  onBack,
  onBuildOwn
}) {
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const safeEntries = Array.isArray(entries) ? entries : [];

  const filteredEntries = filterType === "all"
    ? safeEntries
    : safeEntries.filter(e => e.entry_type === filterType);

  const counts = {
    all: safeEntries.length,
    project: safeEntries.filter(e => e.entry_type === "project").length,
    certificate: safeEntries.filter(e => e.entry_type === "certificate").length,
    hackathon: safeEntries.filter(e => e.entry_type === "hackathon").length
  };

  const evidenceCount = safeEntries.filter(e => Boolean(e.evidence_url)).length;
  const selfCount = safeEntries.length - evidenceCount;

  function copyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="public-portfolio-page">
      {/* Sample Banner if sample */}
      {sample && (
        <aside aria-label="Sample Portfolio Notice" className="sample-portfolio-top-banner">
          <div className="sample-banner-inner">
            <div className="sample-banner-left">
              <span className="sample-tag-pill">
                <Sparkles size={13} />
                SAMPLE PORTFOLIO
              </span>
              <span className="sample-banner-text">
                Illustrative example — not a real person's verified record
              </span>
            </div>
            {onBuildOwn && (
              <button
                type="button"
                className="sample-banner-cta-btn"
                onClick={onBuildOwn}
              >
                Create your own portfolio <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Public Topbar */}
      <header className="public-nav-topbar">
        <div className="public-nav-inner">
          <div className="public-nav-left">
            <button
              type="button"
              className="back-home-btn"
              onClick={onBack}
              aria-label="Back to home"
            >
              <ArrowLeft size={16} />
              <span>Home</span>
            </button>
            <div className="nav-vertical-divider" />
            <Brand onClick={onBack} size="small" />
          </div>

          <div className="public-nav-right">
            <span className="public-live-indicator">
              <span className="live-pulse-dot" />
              <span>Public Showcase</span>
            </span>

            <button
              type="button"
              className={`copy-link-btn ${copied ? "copied" : ""}`}
              onClick={copyLink}
            >
              {copied ? (
                <>
                  <Check size={14} className="copied-check-icon" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 size={14} />
                  <span>Share Portfolio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="public-portfolio-container">
        {/* Profile Hero Header */}
        <section className="student-profile-hero-card">
          <div className="profile-hero-grid">
            <div className="student-avatar-large">
              <span>{initials(profile?.full_name)}</span>
            </div>

            <div className="student-hero-content">
              <div className="profile-hero-badge-row">
                <span className="student-meta-badge">STUDENT PORTFOLIO</span>
                {profile?.username && (
                  <span className="student-handle-badge">@{profile.username}</span>
                )}
              </div>

              <h1 className="student-name-title">{profile?.full_name || "Student Name"}</h1>
              <p className="student-bio-text">
                {profile?.bio ||
                  "A showcase of student projects, certificates, and hackathons built with intention."}
              </p>

              {/* Stats & Trust Signals */}
              <div className="hero-metrics-strip">
                <div className="metric-item">
                  <span className="metric-number">{safeEntries.length}</span>
                  <span className="metric-label">Total Entries</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-item">
                  <span className="metric-number text-emerald">{evidenceCount}</span>
                  <span className="metric-label">Evidence Linked</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-item">
                  <span className="metric-number text-amber">{selfCount}</span>
                  <span className="metric-label">Self-Reported</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-item trust-notice">
                  <ShieldCheck size={16} className="text-emerald" />
                  <span className="trust-text">Evidence links are inspectable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="student-skills-tray">
              <span className="skills-tray-title">SKILLS & TECHNOLOGIES</span>
              <div className="skill-pills-row">
                {skills.map(skill => (
                  <span key={skill} className="skill-badge-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Portfolio Entries Section */}
        <section className="portfolio-showcase-section">
          <div className="showcase-header-row">
            <div>
              <div className="section-eyebrow">PORTIVUE SHOWCASE</div>
              <h2 className="section-title">Projects, Learning & Accomplishments</h2>
            </div>

            {/* Filter Tabs */}
            <div className="portfolio-filter-tabs">
              <button
                type="button"
                className={`filter-tab-pill ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                <span>All</span>
                <span className="tab-count-badge">{counts.all}</span>
              </button>
              <button
                type="button"
                className={`filter-tab-pill ${filterType === "project" ? "active" : ""}`}
                onClick={() => setFilterType("project")}
              >
                <Code2 size={13} />
                <span>Projects</span>
                <span className="tab-count-badge">{counts.project}</span>
              </button>
              <button
                type="button"
                className={`filter-tab-pill ${filterType === "certificate" ? "active" : ""}`}
                onClick={() => setFilterType("certificate")}
              >
                <FileBadge size={13} />
                <span>Certificates</span>
                <span className="tab-count-badge">{counts.certificate}</span>
              </button>
              <button
                type="button"
                className={`filter-tab-pill ${filterType === "hackathon" ? "active" : ""}`}
                onClick={() => setFilterType("hackathon")}
              >
                <Trophy size={13} />
                <span>Hackathons</span>
                <span className="tab-count-badge">{counts.hackathon}</span>
              </button>
            </div>
          </div>

          {/* Entries Grid */}
          {filteredEntries.length > 0 ? (
            <div className="entries-cards-grid">
              {filteredEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} editable={false} />
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon-circle">
                <Code2 size={24} />
              </div>
              <h3 className="empty-title">
                {filterType === "all"
                  ? "No portfolio entries yet"
                  : `No ${filterType} entries found`}
              </h3>
              <p className="empty-subtitle">
                {filterType === "all"
                  ? "This student hasn't published any portfolio entries yet."
                  : `Try selecting a different category or view all entries.`}
              </p>
              {filterType !== "all" && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setFilterType("all")}
                >
                  Show all entries
                </button>
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="public-portfolio-footer">
          <div className="footer-content">
            <Brand onClick={onBack} size="small" />
            <p className="footer-copy-text">
              Portivue — A student portfolio backed by evidence.
            </p>
            {onBuildOwn && (
              <button
                type="button"
                className="footer-build-btn"
                onClick={onBuildOwn}
              >
                Build your own portfolio <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  Plus,
  LogOut,
  ArrowUpRight,
  Link2,
  Check,
  Globe,
  Edit3,
  Search,
  Code2,
  FileBadge,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
  Eye,
  AlertCircle
} from "lucide-react";
import Brand from "./Brand";
import EntryCard from "./EntryCard";
import EntryEditorModal from "./EntryEditorModal";
import ProfileModal from "./ProfileModal";
import DeleteModal from "./DeleteModal";
import { initials } from "../constants";
import { supabase } from "../supabase";

export default function Dashboard({
  user,
  onSignOut,
  onHome,
  onViewPublic,
  showToast
}) {
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Drafts
  const [editingProfile, setEditingProfile] = useState(false);
  const [entryDraft, setEntryDraft] = useState(undefined); // null = new, object = edit, undefined = closed
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [copiedLink, setCopiedLink] = useState(false);

  // Load real user profile & entries from Supabase
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch profile
      let { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // Self-healing fallback if profile row doesn't exist
      if (!profileData && (!profileErr || profileErr.code === "PGRST116")) {
        const fallbackHandle = (
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "student"
        )
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 20) + "-" + user.id.slice(0, 6);

        const { data: createdProfile, error: createErr } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            username: fallbackHandle,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
            bio: "Student building and sharing work on Portivue.",
            skills: []
          })
          .select()
          .single();

        if (!createErr && createdProfile) {
          profileData = createdProfile;
        }
      }

      if (profileData) {
        setProfile(profileData);
      } else if (profileErr) {
        setError(profileErr.message);
      }

      // 2. Fetch portfolio entries
      const { data: entriesData, error: entriesErr } = await supabase
        .from("portfolio_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (entriesErr) {
        setError(prev => (prev ? `${prev} · ${entriesErr.message}` : entriesErr.message));
      } else {
        setEntries(entriesData || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Save / Update Profile
  async function handleSaveProfile(updatedFields) {
    setSaving(true);
    setError("");

    try {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          full_name: updatedFields.full_name,
          username: updatedFields.username,
          bio: updatedFields.bio,
          skills: updatedFields.skills,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      setEditingProfile(false);
      showToast?.("Profile updated successfully!");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  // Save Entry (Add or Edit)
  async function handleSaveEntry(formData) {
    setSaving(true);
    setError("");

    const isEdit = Boolean(formData.id);
    const payload = {
      user_id: user.id,
      title: formData.title,
      entry_type: formData.entry_type,
      description: formData.description,
      evidence_url: formData.evidence_url,
      is_public: formData.is_public !== false
    };

    try {
      let query;
      if (isEdit) {
        query = supabase
          .from("portfolio_entries")
          .update(payload)
          .eq("id", formData.id)
          .eq("user_id", user.id);
      } else {
        query = supabase.from("portfolio_entries").insert(payload);
      }

      let { error: saveErr } = await query;

      // Defensive fallback: If remote table doesn't have is_public column
      if (saveErr && saveErr.message && saveErr.message.includes("is_public")) {
        delete payload.is_public;
        if (isEdit) {
          const res = await supabase
            .from("portfolio_entries")
            .update(payload)
            .eq("id", formData.id)
            .eq("user_id", user.id);
          saveErr = res.error;
        } else {
          const res = await supabase.from("portfolio_entries").insert(payload);
          saveErr = res.error;
        }
      }

      if (saveErr) throw saveErr;

      setEntryDraft(undefined);
      showToast?.(isEdit ? "Entry updated successfully!" : "Entry created successfully!");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to save portfolio entry.");
    } finally {
      setSaving(false);
    }
  }

  // Toggle Entry Public / Private
  async function handleTogglePublic(entry) {
    setError("");
    const newStatus = entry.is_public === false;

    try {
      const { error: updateErr } = await supabase
        .from("portfolio_entries")
        .update({ is_public: newStatus })
        .eq("id", entry.id)
        .eq("user_id", user.id);

      if (updateErr) {
        // If column is missing in db, inform user gently
        if (updateErr.message.includes("is_public")) {
          showToast?.("Visibility toggling requires is_public column in database.", "info");
          return;
        }
        throw updateErr;
      }

      showToast?.(newStatus ? "Entry published to public portfolio." : "Entry set to private.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update visibility.");
    }
  }

  // Delete Entry
  async function handleDeleteEntry(entry) {
    setDeleting(true);
    setError("");

    try {
      const { error: delErr } = await supabase
        .from("portfolio_entries")
        .delete()
        .eq("id", entry.id)
        .eq("user_id", user.id);

      if (delErr) throw delErr;

      setDeleteTarget(null);
      showToast?.("Entry permanently deleted.");
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    } catch (err) {
      setError(err.message || "Failed to delete entry.");
    } finally {
      setDeleting(false);
    }
  }

  // Copy Public Link
  const publicUrl = profile?.username
    ? `${window.location.origin}/u/${profile.username}`
    : "";

  function copyPublicLink() {
    if (!publicUrl) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      showToast?.("Portfolio URL copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  // Filtered & Searched entries
  const filteredEntries = entries.filter(e => {
    const matchesType = filterType === "all" || e.entry_type === filterType;
    const matchesSearch =
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const evidenceCount = entries.filter(e => Boolean(e.evidence_url)).length;
  const selfCount = entries.length - evidenceCount;
  const proofRatio = entries.length > 0 ? Math.round((evidenceCount / entries.length) * 100) : 0;

  const counts = {
    all: entries.length,
    project: entries.filter(e => e.entry_type === "project").length,
    certificate: entries.filter(e => e.entry_type === "certificate").length,
    hackathon: entries.filter(e => e.entry_type === "hackathon").length
  };

  return (
    <div className="dashboard-layout">
      {/* SaaS App Header */}
      <header className="dashboard-app-header">
        <div className="dashboard-header-inner">
          <div className="header-left-col">
            <Brand onClick={onHome} size="default" />
            <div className="nav-vertical-divider" />
            <div className="workspace-breadcrumb">
              <span className="crumb-root">Workspace</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Portfolio</span>
            </div>
          </div>

          <div className="header-right-col">
            {publicUrl && (
              <button
                type="button"
                className="btn-header-preview"
                onClick={() => onViewPublic(profile, entries)}
              >
                <Globe size={14} />
                <span>View Public Profile</span>
                <ArrowUpRight size={13} />
              </button>
            )}

            <div className="user-profile-badge">
              <div className="user-avatar-small">
                {initials(profile?.full_name || user.email)}
              </div>
              <div className="user-info-text">
                <span className="user-name-label">
                  {profile?.full_name || "Student"}
                </span>
                <span className="user-email-label">{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-signout"
              onClick={onSignOut}
              title="Sign out of Portivue"
            >
              <LogOut size={16} />
              <span className="signout-text">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="dashboard-main-container">
        {/* Error Alert if any */}
        {error && (
          <div className="form-alert-banner error workspace-alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="dashboard-skeleton-wrap">
            <div className="skeleton-card skeleton-profile-box" />
            <div className="skeleton-grid-4">
              <div className="skeleton-metric-card" />
              <div className="skeleton-metric-card" />
              <div className="skeleton-metric-card" />
              <div className="skeleton-metric-card" />
            </div>
            <div className="skeleton-cards-grid">
              <div className="skeleton-entry-card" />
              <div className="skeleton-entry-card" />
            </div>
          </div>
        ) : (
          <>
            {/* 1. Student Profile Overview Card */}
            <section className="profile-overview-card">
              <div className="profile-overview-grid">
                <div className="overview-avatar-wrap">
                  <div className="profile-avatar-overview">
                    {initials(profile?.full_name)}
                  </div>
                </div>

                <div className="overview-details">
                  <div className="overview-name-row">
                    <div>
                      <h1 className="profile-overview-name">
                        {profile?.full_name || "Add Your Name"}
                      </h1>
                      {profile?.username && (
                        <div className="profile-overview-handle">
                          @{profile.username}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setEditingProfile(true)}
                    >
                      <Edit3 size={14} />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <p className="profile-overview-bio">
                    {profile?.bio ||
                      "Add a short biography so viewers know your passions, focus areas, and goals."}
                  </p>

                  <div className="profile-overview-skills">
                    {(profile?.skills || []).length > 0 ? (
                      <div className="skill-pills-row">
                        {(profile.skills || []).map(skill => (
                          <span key={skill} className="skill-badge-pill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-skills-hint">
                        No skills listed yet. Click "Edit Profile" to add relevant tools and frameworks.
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Share Strip */}
                <div className="overview-share-card">
                  <div className="share-header">
                    <Globe size={15} className="text-emerald" />
                    <span>Your Public Portfolio</span>
                  </div>
                  <p className="share-desc">
                    Share this unique read-only link with recruiters, mentors, and peers:
                  </p>
                  <div className="share-url-pill">
                    <span className="share-url-text">
                      {publicUrl || "Setting up your handle..."}
                    </span>
                  </div>
                  <div className="share-buttons-row">
                    <button
                      type="button"
                      className={`btn-share-copy ${copiedLink ? "copied" : ""}`}
                      onClick={copyPublicLink}
                      disabled={!publicUrl}
                    >
                      {copiedLink ? (
                        <>
                          <Check size={14} />
                          <span>Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Link2 size={14} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-share-preview"
                      onClick={() => onViewPublic(profile, entries)}
                      disabled={!publicUrl}
                    >
                      <span>Preview</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Portfolio Metrics Banner */}
            <section className="portfolio-metrics-grid">
              <div className="metric-box">
                <span className="metric-box-label">Total Entries</span>
                <div className="metric-box-val-row">
                  <span className="metric-box-val">{entries.length}</span>
                  <span className="metric-box-badge">Showcase</span>
                </div>
              </div>

              <div className="metric-box">
                <span className="metric-box-label">Evidence Linked</span>
                <div className="metric-box-val-row">
                  <span className="metric-box-val text-emerald">{evidenceCount}</span>
                  <span className="metric-box-badge badge-green">Inspectable</span>
                </div>
              </div>

              <div className="metric-box">
                <span className="metric-box-label">Self-Reported</span>
                <div className="metric-box-val-row">
                  <span className="metric-box-val text-amber">{selfCount}</span>
                  <span className="metric-box-badge badge-amber">Self</span>
                </div>
              </div>

              <div className="metric-box">
                <span className="metric-box-label">Evidence Backed</span>
                <div className="metric-box-val-row">
                  <span className="metric-box-val">{proofRatio}%</span>
                  <span className="metric-box-badge">Proof Rate</span>
                </div>
              </div>
            </section>

            {/* 3. Portfolio Entries Management Section */}
            <section className="portfolio-management-panel">
              <div className="management-header-row">
                <div>
                  <h2 className="management-title">Portfolio Entries</h2>
                  <p className="management-sub">
                    Manage your projects, certifications, and hackathons. All updates reflect instantly on your public link.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setEntryDraft(null)}
                >
                  <Plus size={16} />
                  <span>Add Entry</span>
                </button>
              </div>

              {/* Controls: Search & Tabs */}
              <div className="portfolio-controls-bar">
                <div className="search-input-wrap">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    className="styled-search-input"
                    placeholder="Search by title or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="filter-tabs-cluster">
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

              {/* Entries Grid or Empty States */}
              {filteredEntries.length > 0 ? (
                <div className="entries-cards-grid">
                  {filteredEntries.map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      editable={true}
                      onEdit={setEntryDraft}
                      onDelete={setDeleteTarget}
                      onTogglePublic={handleTogglePublic}
                    />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                /* Empty state when user has 0 entries */
                <div className="empty-state-card primary-empty-state">
                  <div className="empty-state-icon-circle">
                    <Sparkles size={26} className="text-emerald" />
                  </div>
                  <h3 className="empty-title">Your portfolio is ready for its first entry.</h3>
                  <p className="empty-subtitle">
                    Add a project, certificate, or hackathon. Link your GitHub repo, live demo, or credential to give reviewers inspectable proof.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setEntryDraft(null)}
                  >
                    <Plus size={16} />
                    <span>Add Your First Entry</span>
                  </button>
                </div>
              ) : (
                /* Empty state when filter/search returns 0 matches */
                <div className="empty-state-card filter-empty-state">
                  <div className="empty-state-icon-circle">
                    <Search size={24} />
                  </div>
                  <h3 className="empty-title">No matching entries found</h3>
                  <p className="empty-subtitle">
                    No portfolio entries matched your current search and filter settings.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                    }}
                  >
                    Reset Search & Filters
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Profile Edit Modal */}
      {editingProfile && (
        <ProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onCancel={() => setEditingProfile(false)}
          saving={saving}
        />
      )}

      {/* Add / Edit Entry Modal */}
      {entryDraft !== undefined && (
        <EntryEditorModal
          initial={entryDraft}
          onSave={handleSaveEntry}
          onCancel={() => setEntryDraft(undefined)}
          saving={saving}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          entry={deleteTarget}
          onConfirm={handleDeleteEntry}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

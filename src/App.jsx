import React, { useEffect, useState } from "react";
import {
  ArrowDownRight, ArrowUpRight, BadgeCheck, BookOpen,
  BriefcaseBusiness, Check, CircleHelp, Code2, ExternalLink,
  FileBadge, Globe2, GraduationCap, Link2, LogOut, Plus,
  ShieldCheck, Sparkles, Trash2, Trophy, X
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./supabase";

const SAMPLE = {
  username: "alex-morgan",
  full_name: "Alex Morgan",
  bio: "Computer science student building thoughtful tools at the intersection of AI, design, and everyday problems. I learn by shipping small things and sharing the receipts.",
  skills: ["React", "Python", "UI/UX", "Machine Learning", "Supabase"],
  entries: [
    { id: "sample-1", title: "StudyFlow — a calmer study planner", description: "Built a lightweight planner that turns a syllabus into weekly study sessions. Designed the interface, implemented the responsive app, and tested the flow with classmates.", entry_type: "project", evidence_url: "https://github.com", created_at: "2026-09-14" },
    { id: "sample-2", title: "Intro to Machine Learning", description: "Completed a beginner course covering supervised learning, model evaluation, and practical Python workflows.", entry_type: "certificate", evidence_url: "https://coursera.org", created_at: "2026-08-20" },
    { id: "sample-3", title: "Campus Buildathon 2026", description: "Collaborated in a three-person team to prototype a campus navigation concept during a 24-hour build event.", entry_type: "hackathon", evidence_url: "https://devpost.com", created_at: "2026-07-03" }
  ]
};

const icons = { project: Code2, certificate: FileBadge, hackathon: Trophy };
const labels = { project: "Project", certificate: "Certificate", hackathon: "Hackathon" };
const dateLabel = value =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently added";

function initials(name = "Proof Of Work") {
  return name.trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();
}

function safeUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="ProofOfWork home">
      <span className="brand-mark"><span /><span /><span /><span /></span>
      <span>Proof<span className="brand-light">OfWork</span></span>
    </button>
  );
}

function Header({ onHome, onAuth, user, onDashboard }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand onClick={onHome} />
        <nav className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#sample">Explore</a>
        </nav>
        <div className="nav-actions">
          {user ? (
            <button className="button button-dark button-small" onClick={onDashboard}>
              My workspace <ArrowUpRight size={15} />
            </button>
          ) : (
            <>
              <button className="button button-quiet button-small" onClick={() => onAuth("signin")}>
                Log in
              </button>
              <button className="button button-dark button-small" onClick={() => onAuth("signup")}>
                Build your portfolio <ArrowUpRight size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function EntryCard({ entry, editable, onEdit, onDelete, onTogglePublic }) {
  const Icon = icons[entry.entry_type] || Code2;
  const link = safeUrl(entry.evidence_url);
  const hasEvidence = Boolean(link);

  return (
    <article className="entry-card">
      <div className="entry-topline">
        <span className="entry-type">
          <Icon size={14} />
          {labels[entry.entry_type] || "Project"}
        </span>
        <span className={`evidence-pill ${hasEvidence ? "linked" : ""}`}>
          <span className="status-dot" />
          {hasEvidence ? "Evidence linked" : "Self-reported"}
        </span>
        {editable && (
          <span className="entry-visibility">
            {entry.is_public ? "Public" : "Private"}
          </span>
        )}
      </div>

      <h3>{entry.title}</h3>
      <p className="entry-description">{entry.description}</p>

      <div className="entry-bottom">
        <span className="entry-date">{dateLabel(entry.created_at)}</span>
        <div className="entry-actions">
          {link && (
            <a className="text-link" href={link} target="_blank" rel="noreferrer">
              View evidence <ArrowUpRight size={14} />
            </a>
          )}

          {editable && (
            <>
              <button
                type="button"
                className="icon-button"
                aria-label="Edit entry"
                onClick={() => onEdit(entry)}
              >
                <span className="sr-only">Edit</span>
                <BookOpen size={15} />
              </button>

              <button
                type="button"
                className="icon-button danger"
                aria-label="Delete entry"
                onClick={() => onDelete(entry)}
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                className="button button-quiet button-small"
                onClick={() => onTogglePublic(entry)}
              >
                {entry.is_public ? "Make private" : "Make public"}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function PublicPortfolio({ profile, entries, sample = false, onBack }) {
  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  return (
    <div className="portfolio-page">
      <div className="portfolio-nav">
        <Brand onClick={onBack} />
        <div className="portfolio-nav-right">
          <span className="public-label"><Globe2 size={14} /> Public portfolio</span>
          <button
            className="button button-outline button-small"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            Copy profile link <Link2 size={14} />
          </button>
        </div>
      </div>

      <main className="portfolio-main">
        {sample && (
          <div className="sample-banner">
            <Sparkles size={15} /> SAMPLE PORTFOLIO
            <span>Illustrative example — not a real person's verified record</span>
          </div>
        )}

        <section className="profile-hero">
          <div className="profile-avatar">{initials(profile.full_name)}</div>
          <div className="profile-heading">
            <div className="eyebrow">STUDENT PORTFOLIO <span className="eyebrow-line" /></div>
            <h1>{profile.full_name || "Your name here"}</h1>
            <p>{profile.bio || "A short introduction about what you’re learning and building."}</p>
            <div className="profile-meta">
              <span><BriefcaseBusiness size={15} />{entries.length} pieces of work</span>
              <span><ShieldCheck size={15} /> Evidence is linked, not verified</span>
            </div>
          </div>
        </section>

        {skills.length > 0 && (
          <section className="skills-section">
            <div className="section-kicker">WHAT I WORK WITH</div>
            <div className="skill-list">
              {skills.map(skill => <span className="skill-chip" key={skill}>{skill}</span>)}
            </div>
          </section>
        )}

        <section className="work-section">
          <div className="work-heading">
            <div>
              <div className="section-kicker">THE WORK</div>
              <h2>Projects, progress, proof.</h2>
            </div>
            <span className="work-count">{entries.length.toString().padStart(2, "0")} ENTRIES</span>
          </div>

          {entries.length ? (
            <div className="entry-grid">
              {entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}
            </div>
          ) : (
            <div className="empty-state">
              <Code2 size={24} />
              <h3>Work in progress</h3>
              <p>This portfolio doesn’t have any entries yet.</p>
            </div>
          )}
        </section>

        <footer className="portfolio-footer">
          <Brand onClick={onBack} />
          <span>Built with intention. Shared with evidence.</span>
          <span>ProofOfWork © 2026</span>
        </footer>
      </main>
    </div>
  );
}

function AuthModal({ mode, setMode, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured yet. Add your project URL and publishable key to .env.local.");
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } }
        });

        if (error) throw error;

        if (!data.session) {
          setMessage("Check your inbox to confirm your email, then log in.");
        } else {
          onSuccess(data.session.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="modal-logo">
          <span className="brand-mark"><span /><span /><span /><span /></span>
        </div>
        <div className="eyebrow">YOUR WORK, IN ONE PLACE</div>
        <h2>{mode === "signup" ? "Make your work count." : "Welcome back."}</h2>
        <p className="modal-subtitle">
          {mode === "signup" ? "Create a profile that shows what you can do." : "Pick up where you left off."}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && (
            <label>Full name
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex Morgan" required maxLength={80} />
            </label>
          )}
          <label>Email address
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
          </label>
          <label>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </label>

          {error && <div className="form-message error">{error}</div>}
          {message && <div className="form-message success">{message}</div>}

          <button className="button button-dark button-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
            <ArrowUpRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signup" ? "Already have an account?" : "New to ProofOfWork?"}
          {" "}
          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setMessage(""); }}>
            {mode === "signup" ? "Log in" : "Create account"}
          </button>
        </p>
        <p className="privacy-note"><ShieldCheck size={13} /> Your account is secured by Supabase Auth.</p>
      </div>
    </div>
  );
}

function EntryEditor({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      title: "",
      description: "",
      entry_type: "project",
      evidence_url: "",
      is_public: false
    }
  );
  const [error, setError] = useState("");

  const change = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Add a title before saving.");
    if (form.evidence_url && !safeUrl(form.evidence_url)) {
      return setError("Use a full evidence URL beginning with https:// or http://.");
    }

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      evidence_url: form.evidence_url.trim() || null,
      is_public: Boolean(form.is_public)
    });
  }

  return (
    <form className="editor-form" onSubmit={submit}>
      <label>Entry title
        <input value={form.title} onChange={e => change("title", e.target.value)} maxLength={120} placeholder="What did you build or complete?" required />
      </label>
      <label>Type
        <select value={form.entry_type} onChange={e => change("entry_type", e.target.value)}>
          <option value="project">Project</option>
          <option value="certificate">Certificate</option>
          <option value="hackathon">Hackathon</option>
        </select>
      </label>
      <label>Description
        <textarea value={form.description} onChange={e => change("description", e.target.value)} rows={4} maxLength={3000} placeholder="What was the goal, your contribution, and what did you learn?" />
      </label>
      <label>Visibility
        <select value={form.is_public ? "public" : "private"} onChange={e => change("is_public", e.target.value === "public")}>
          <option value="private">Private — only you can view</option>
          <option value="public">Public — anyone can view</option>
        </select>
      </label>
      <label>Evidence URL <span className="optional-label">OPTIONAL</span>
        <input value={form.evidence_url || ""} onChange={e => change("evidence_url", e.target.value)} placeholder="https://github.com/…" />
      </label>
      <p className="field-hint"><ShieldCheck size={14} /> A link helps people inspect your work. ProofOfWork does not verify claims or links.</p>
      {error && <div className="form-message error">{error}</div>}
      <div className="editor-actions">
        <button type="button" className="button button-outline" onClick={onCancel}>Cancel</button>
        <button className="button button-dark">{initial?.id ? "Save changes" : "Add entry"} <ArrowUpRight size={15} /></button>
      </div>
    </form>
  );
}

function Dashboard({ user, onSignOut, onViewPublic, onHome }) {
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [entryDraft, setEntryDraft] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", bio: "", skills: "" });

  async function load() {
    setLoading(true);
    setError("");

    const [p, e] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("portfolio_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    ]);

    if (p.error) {
      setError(p.error.message);
    } else {
      setProfile(p.data);
      setProfileForm({
        full_name: p.data.full_name || "",
        bio: p.data.bio || "",
        skills: (p.data.skills || []).join(", ")
      });
    }

    if (e.error) {
      setError(prev => prev ? `${prev} · ${e.error.message}` : e.error.message);
    } else {
      setEntries(e.data || []);
    }

    setLoading(false);
  }

  useEffect(() => { load(); }, [user.id]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const skills = profileForm.skills.split(",").map(s => s.trim()).filter(Boolean).slice(0, 30);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name.trim(),
      bio: profileForm.bio.trim(),
      skills
    }).eq("id", user.id);

    if (error) setError(error.message);
    else {
      setEditingProfile(false);
      await load();
    }
    setSaving(false);
  }

  async function saveEntry(form) {
    setSaving(true);
    setError("");

    const payload = { ...form, user_id: user.id };
    const query = form.id
      ? supabase.from("portfolio_entries").update(payload).eq("id", form.id).eq("user_id", user.id)
      : supabase.from("portfolio_entries").insert(payload);

    const { error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setEntryDraft(undefined);
      await load();
    }
    setSaving(false);
  }

  async function toggleEntryPublic(entry) {
    setError("");

    const { error } = await supabase
      .from("portfolio_entries")
      .update({ is_public: !entry.is_public })
      .eq("id", entry.id)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
      return;
    }

    await load();
  }

  async function deleteEntry(entry) {
    if (!window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) return;

    const { error } = await supabase.from("portfolio_entries")
      .delete()
      .eq("id", entry.id)
      .eq("user_id", user.id);

    if (error) setError(error.message);
    else setEntries(prev => prev.filter(x => x.id !== entry.id));
  }

  const publicUrl = profile?.username ? `${window.location.origin}/u/${profile.username}` : "";

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <div className="topbar-inner">
          <Brand onClick={onHome} />
          <div className="dashboard-top-right">
            <span className="user-chip">
              <span className="user-avatar">{initials(profile?.full_name || user.email)}</span>
              {profile?.full_name || user.email}
            </span>
            <button className="button button-quiet button-small" onClick={onSignOut}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-title-row">
          <div>
            <div className="eyebrow">YOUR WORKSPACE</div>
            <h1>Make your work <span>visible.</span></h1>
            <p>Keep your projects, learning, and proof in one place.</p>
          </div>
          <button className="button button-dark" onClick={() => setEntryDraft(null)}>
            <Plus size={17} /> Add an entry
          </button>
        </div>

        {error && <div className="form-message error dashboard-error">{error}</div>}

        {loading ? <div className="loading-state">Loading your workspace…</div> : (
          <>
            <section className="dashboard-profile panel">
              <div className="panel-heading">
                <div><div className="section-kicker">PROFILE</div><h2>Your introduction</h2></div>
                <button className="button button-outline button-small" onClick={() => setEditingProfile(!editingProfile)}>
                  {editingProfile ? "Cancel" : "Edit profile"}
                </button>
              </div>

              {editingProfile ? (
                <form className="editor-form profile-editor" onSubmit={saveProfile}>
                  <label>Full name
                    <input required maxLength={80} value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                  </label>
                  <label>Bio
                    <textarea rows={3} maxLength={600} value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="What are you learning, building, or exploring?" />
                  </label>
                  <label>Skills <span className="optional-label">COMMA-SEPARATED</span>
                    <input value={profileForm.skills} onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })} placeholder="Python, React, UI/UX" />
                  </label>
                  <div className="editor-actions">
                    <button type="button" className="button button-outline" onClick={() => setEditingProfile(false)}>Cancel</button>
                    <button className="button button-dark" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
                  </div>
                </form>
              ) : (
                <div className="profile-preview">
                  <div className="profile-avatar">{initials(profile?.full_name)}</div>
                  <div>
                    <h3>{profile?.full_name || "Add your name"}</h3>
                    <p>{profile?.bio || "Add a short bio so people know what you care about."}</p>
                    <div className="skill-list">
                      {(profile?.skills || []).map(s => <span className="skill-chip" key={s}>{s}</span>)}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="share-panel">
              <div className="share-icon"><Globe2 size={21} /></div>
              <div className="share-copy">
                <div className="section-kicker">YOUR PUBLIC PROFILE</div>
                <h3>One link. Your work, clearly presented.</h3>
                <p>Anyone with the link can view your profile and public entries.</p>
                <div className="share-url">{publicUrl || "Username is being set up…"}</div>
              </div>
              <div className="share-actions">
                <button
                  className="button button-dark button-small"
                  onClick={() => onViewPublic(profile, entries)}
                >
                  Preview <ArrowUpRight size={14} />
                </button>
                <button
                  className="button button-outline button-small"
                  onClick={() => navigator.clipboard?.writeText(publicUrl)}
                  disabled={!publicUrl}
                >
                  <Link2 size={14} /> Copy link
                </button>
              </div>
            </section>

            <section className="dashboard-entries">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">YOUR PORTFOLIO</div>
                  <h2>Entries <span className="muted-count">{entries.length.toString().padStart(2, "0")}</span></h2>
                </div>
                <button className="button button-outline button-small" onClick={() => setEntryDraft(null)}>
                  <Plus size={15} /> Add entry
                </button>
              </div>

              {entries.length ? (
                <div className="entry-grid">
                  {entries.map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      editable
                      onEdit={setEntryDraft}
                      onDelete={deleteEntry}
                      onTogglePublic={toggleEntryPublic}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"><Code2 size={24} /></div>
                  <h3>Your first entry starts here.</h3>
                  <p>Add a project, certificate, or hackathon. An evidence link is optional.</p>
                  <button className="button button-dark" onClick={() => setEntryDraft(null)}>
                    <Plus size={16} /> Add your first entry
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {entryDraft !== undefined && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setEntryDraft(undefined)}>
          <div className="editor-modal">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">PORTFOLIO ENTRY</div>
                <h2>{entryDraft?.id ? "Edit entry" : "Add something you’ve done."}</h2>
              </div>
              <button className="modal-close" onClick={() => setEntryDraft(undefined)}><X size={18} /></button>
            </div>
            <EntryEditor initial={entryDraft} onSave={saveEntry} onCancel={() => setEntryDraft(undefined)} />
            {saving && <div className="saving-overlay">Saving…</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Landing({ onAuth, onSample }) {
  return (
    <div className="landing">
      <section className="hero-wrap">
        <div className="hero-copy">
          <div className="hero-eyebrow"><span className="live-dot" /> FOR STUDENTS WHO BUILD</div>
          <h1>Don't just say<br />you can. <span>Show it.</span></h1>
          <p className="hero-description">A portfolio backed by evidence. Bring your projects, certificates, and hackathons together in one link that speaks for your work.</p>
          <div className="hero-ctas">
            <button className="button button-dark button-large" onClick={() => onAuth("signup")}>
              Build your portfolio <ArrowUpRight size={17} />
            </button>
            <button className="button button-text button-large" onClick={onSample}>
              Explore a sample <ArrowDownRight size={17} />
            </button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack"><span>AM</span><span>RK</span><span>PS</span></div>
            <p><strong>Work over words.</strong><br />Your effort, made easy to explore.</p>
          </div>
        </div>

        <div className="hero-art" aria-label="Preview of a student portfolio">
          <div className="art-grid" />
          <div className="floating-note note-top">
            <span className="note-icon"><Link2 size={16} /></span>
            <span><strong>Evidence linked</strong><small>Inspectable, not verified</small></span>
            <Check size={15} className="note-check" />
          </div>
          <div className="portfolio-mock">
            <div className="mock-top">
              <span className="mock-dot" /><span className="mock-dot" /><span className="mock-dot" />
              <span className="mock-url">proofof.work/u/alex-morgan</span>
              <ExternalLink size={12} />
            </div>
            <div className="mock-content">
              <div className="mock-avatar">AM</div>
              <div className="mock-label">STUDENT PORTFOLIO</div>
              <h3>Alex Morgan<span>.</span></h3>
              <p>Building useful things, learning in public.</p>
              <div className="mock-skills"><span>React</span><span>Python</span><span>AI / ML</span></div>
              <div className="mock-divider" />
              <div className="mock-section-title">SELECTED WORK <span>03 ENTRIES</span></div>
              <div className="mock-project">
                <div className="mock-project-icon"><Code2 size={17} /></div>
                <div className="mock-project-copy"><strong>StudyFlow</strong><small>Study planner · React</small></div>
                <span className="mock-evidence"><span /> LINKED</span>
              </div>
              <div className="mock-project">
                <div className="mock-project-icon warm"><Trophy size={17} /></div>
                <div className="mock-project-copy"><strong>Campus Buildathon</strong><small>Hackathon · Team of 3</small></div>
                <span className="mock-evidence self"><span /> SELF</span>
              </div>
              <div className="mock-project">
                <div className="mock-project-icon blue"><FileBadge size={17} /></div>
                <div className="mock-project-copy"><strong>ML Foundations</strong><small>Certificate · Python</small></div>
                <span className="mock-evidence"><span /> LINKED</span>
              </div>
            </div>
            <div className="mock-footer"><span>ProofOfWork</span><span>SHARED WITH INTENTION ↗</span></div>
          </div>
          <div className="floating-note note-bottom">
            <span className="note-stat">01</span>
            <span><strong>One clean link.</strong><small>Your work, in context.</small></span>
            <ArrowUpRight size={16} />
          </div>
        </div>
      </section>

      <section className="value-strip">
        <div><span className="strip-icon"><Code2 size={17} /></span><span><strong>Show the work</strong><small>Projects with context</small></span></div>
        <div><span className="strip-icon"><FileBadge size={17} /></span><span><strong>Keep the receipts</strong><small>Link to supporting evidence</small></span></div>
        <div><span className="strip-icon"><Globe2 size={17} /></span><span><strong>Share one profile</strong><small>A public portfolio URL</small></span></div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-kicker">SIMPLE BY DESIGN</div>
        <h2>Make your progress<br />easy to <span>see.</span></h2>
        <div className="steps-grid">
          <div className="step-card"><span className="step-number">01 / BUILD</span><div className="step-icon"><GraduationCap size={22} /></div><h3>Tell your story</h3><p>Add a short bio and the skills you’re putting into practice. Keep it real and keep it yours.</p></div>
          <div className="step-card"><span className="step-number">02 / SUPPORT</span><div className="step-icon"><Link2 size={22} /></div><h3>Attach the evidence</h3><p>Link to repositories, certificates, demos, or event pages. No link? Your entry can still stand on its own.</p></div>
          <div className="step-card"><span className="step-number">03 / SHARE</span><div className="step-icon"><Globe2 size={22} /></div><h3>Put it out there</h3><p>Share one clean, read-only profile with recruiters, mentors, and collaborators.</p></div>
        </div>
      </section>

      <section className="trust-section">
        <div className="trust-mark"><ShieldCheck size={24} /></div>
        <div>
          <h3>Clear about what’s proven.</h3>
          <p>A link is a starting point for inspection, not a verification badge. Every entry is labelled “Evidence linked” or “Self-reported” so viewers know what they’re looking at.</p>
        </div>
        <span className="trust-label">TRANSPARENT BY DEFAULT</span>
      </section>

      <section className="sample-section" id="sample">
        <div>
          <div className="section-kicker">TAKE A LOOK AROUND</div>
          <h2>See a portfolio<br />in its natural habitat.</h2>
          <p>Explore an illustrative student profile before creating your own.</p>
        </div>
        <button className="button button-outline" onClick={onSample}>
          View sample portfolio <ArrowUpRight size={16} />
        </button>
      </section>

      <section className="final-cta">
        <div className="cta-spark"><Sparkles size={20} /></div>
        <div className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</div>
        <h2>Let your work<br />do the talking.</h2>
        <button className="button button-light button-large" onClick={() => onAuth("signup")}>
          Create your portfolio <ArrowUpRight size={17} />
        </button>
        <p>Free to start. Yours to share.</p>
      </section>

      <footer className="site-footer">
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <span>A portfolio backed by evidence.</span>
        <span>ProofOfWork © 2026</span>
      </footer>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [page, setPage] = useState("home");
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicEntries, setPublicEntries] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const path = window.location.pathname;

    if (path === "/sample") setPage("sample");
    else if (path === "/dashboard") setPage("dashboard");
    else if (path.startsWith("/u/")) {
      const username = decodeURIComponent(path.slice(3));
      if (username === SAMPLE.username) setPage("sample");
      else loadPublic(username);
    }

    function pop() {
      const p = window.location.pathname;
      if (p === "/sample" || p === `/u/${SAMPLE.username}`) setPage("sample");
      else if (p === "/dashboard") setPage("dashboard");
      else if (p.startsWith("/u/")) loadPublic(decodeURIComponent(p.slice(3)));
      else setPage("home");
    }

    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);

  async function loadPublic(username) {
    if (!isSupabaseConfigured) {
      setNotice("Connect Supabase to load public profiles.");
      setPage("home");
      return;
    }

    const { data: p, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !p) {
      setNotice(error?.message || "That portfolio could not be found.");
      setPage("home");
      return;
    }

    const { data: entries, error: e } = await supabase
      .from("portfolio_entries")
      .select("*")
      .eq("user_id", p.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (e) {
      setNotice(e.message);
      setPage("home");
      return;
    }

    setPublicProfile(p);
    setPublicEntries(entries || []);
    setPage("public");
    setNotice("");
  }

  function navigate(path, nextPage) {
    window.history.pushState({}, "", path);
    setPage(nextPage);
    if (nextPage === "home") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showSample() {
    navigate("/sample", "sample");
  }

  function showDashboard() {
    navigate("/dashboard", "dashboard");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/", "home");
  }

  if (!authReady) {
    return (
      <div className="boot-screen">
        <span className="brand-mark"><span /><span /><span /><span /></span>
        <p>Getting your workspace ready…</p>
      </div>
    );
  }

  if (page === "sample") {
    return <PublicPortfolio profile={SAMPLE} entries={SAMPLE.entries} sample onBack={() => navigate("/", "home")} />;
  }

  if (page === "public") {
    return <PublicPortfolio profile={publicProfile} entries={publicEntries} onBack={() => navigate("/", "home")} />;
  }

  if (page === "dashboard" && user) {
    return (
      <Dashboard
        user={user}
        onSignOut={signOut}
        onHome={() => navigate("/", "home")}
        onViewPublic={(p, e) => {
          setPublicProfile(p);
          setPublicEntries(e.filter(entry => entry.is_public === true));
          navigate(`/u/${p.username}`, "public");
        }}
      />
    );
  }

  return (
    <>
      <Header onHome={() => navigate("/", "home")} onAuth={setAuthMode} user={user} onDashboard={showDashboard} />
      {!isSupabaseConfigured && (
        <div className="config-alert">
          <CircleHelp size={15} /> Demo mode: add your Supabase environment variables to enable sign-up, editing, and saved portfolios.
        </div>
      )}
      {notice && <div className="notice-alert">{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
      <Landing onAuth={setAuthMode} onSample={showSample} />
      {authMode && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthMode(null)}
          onSuccess={async signedInUser => {
            setUser(signedInUser);
            setAuthMode(null);
            showDashboard();
          }}
        />
      )}
    </>
  );
}
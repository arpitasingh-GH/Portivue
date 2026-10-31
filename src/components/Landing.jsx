import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Code2,
  FileBadge,
  Trophy,
  Link2,
  ShieldCheck,
  Globe,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  GraduationCap
} from "lucide-react";
import Brand from "./Brand";

export default function Landing({ onAuth, onSample, user, onDashboard }) {
  return (
    <div className="landing-layout">
      {/* Landing Topbar */}
      <header className="landing-topbar">
        <div className="landing-topbar-inner">
          <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />

          <nav className="landing-nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#transparency">Transparency</a>
            <button type="button" className="nav-text-btn" onClick={onSample}>
              Sample Showcase
            </button>
          </nav>

          <div className="landing-nav-actions">
            {user ? (
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={onDashboard}
              >
                <span>My Workspace</span>
                <ArrowUpRight size={14} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => onAuth("signin")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => onAuth("signup")}
                >
                  <span>Build Portfolio</span>
                  <ArrowUpRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-inner">
          <div className="hero-text-col">
            <div className="hero-eyebrow-badge">
              <span className="live-pulse-dot" />
              <span>FOR STUDENTS WHO BUILD</span>
            </div>

            <h1 className="hero-headline">
              Don’t just say you can. <span className="headline-highlight">Show it.</span>
            </h1>

            <p className="hero-subtext">
              A responsive student portfolio backed by evidence. Showcase your code repositories, certificates, and hackathon wins in one inspectable link.
            </p>

            <div className="hero-cta-buttons">
              <button
                type="button"
                className="btn-primary btn-lg"
                onClick={() => onAuth("signup")}
              >
                <span>Build Your Portfolio</span>
                <ArrowUpRight size={17} />
              </button>

              <button
                type="button"
                className="btn-secondary btn-lg"
                onClick={onSample}
              >
                <span>Explore Sample</span>
                <ArrowDownRight size={17} />
              </button>
            </div>

            <div className="hero-social-proof">
              <div className="avatar-group-stack">
                <span className="avatar-letter av-1">AM</span>
                <span className="avatar-letter av-2">RK</span>
                <span className="avatar-letter av-3">JL</span>
              </div>
              <div className="social-proof-text">
                <strong>Inspectable receipts.</strong>
                <span>Work speaks louder than buzzwords.</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Mockup Card */}
          <div className="hero-preview-col">
            <div className="mockup-tilt-wrapper">
              {/* Floating Badge Top */}
              <div className="floating-badge-pill pill-top">
                <span className="pill-icon-circle green">
                  <CheckCircle2 size={14} />
                </span>
                <div className="pill-text-block">
                  <strong>Evidence linked</strong>
                  <small>Inspectable repos & links</small>
                </div>
              </div>

              {/* The Mock Portfolio Frame */}
              <div className="browser-mockup-frame">
                <div className="mockup-browser-header">
                  <div className="browser-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <div className="browser-address-bar">
                    <span>portivue.app/u/alex-morgan</span>
                  </div>
                  <ExternalLink size={12} className="browser-external-icon" />
                </div>

                <div className="mockup-content-body">
                  <div className="mock-profile-header">
                    <div className="mock-avatar">AM</div>
                    <div>
                      <div className="mock-tag">STUDENT PORTFOLIO</div>
                      <h4 className="mock-name">Alex Morgan</h4>
                      <p className="mock-bio">CS @ Stanford. Shipping tools at the AI/human interface.</p>
                    </div>
                  </div>

                  <div className="mock-skills-row">
                    <span>React</span>
                    <span>Python</span>
                    <span>TypeScript</span>
                    <span>Supabase</span>
                  </div>

                  <div className="mock-entries-list">
                    <div className="mock-entry-item">
                      <div className="mock-entry-icon indigo">
                        <Code2 size={14} />
                      </div>
                      <div className="mock-entry-meta">
                        <strong>StudyFlow</strong>
                        <small>Calm study planner · React</small>
                      </div>
                      <span className="mock-badge linked">Evidence linked</span>
                    </div>

                    <div className="mock-entry-item">
                      <div className="mock-entry-icon amber">
                        <Trophy size={14} />
                      </div>
                      <div className="mock-entry-meta">
                        <strong>Campus Buildathon</strong>
                        <small>Hackathon · Accessibility nav</small>
                      </div>
                      <span className="mock-badge linked">Evidence linked</span>
                    </div>

                    <div className="mock-entry-item">
                      <div className="mock-entry-icon teal">
                        <FileBadge size={14} />
                      </div>
                      <div className="mock-entry-meta">
                        <strong>ML Foundations</strong>
                        <small>Certificate · Coursera</small>
                      </div>
                      <span className="mock-badge self">Self-reported</span>
                    </div>
                  </div>
                </div>

                <div className="mockup-footer-bar">
                  <span>Portivue</span>
                  <span>100% INSPECTABLE ↗</span>
                </div>
              </div>

              {/* Floating Badge Bottom */}
              <div className="floating-badge-pill pill-bottom">
                <span className="pill-icon-circle blue">
                  <Globe size={14} />
                </span>
                <div className="pill-text-block">
                  <strong>Unique URL</strong>
                  <small>Share with mentors & recruiters</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="landing-feature-strip">
        <div className="strip-inner">
          <div className="strip-item">
            <div className="strip-icon-box">
              <Code2 size={18} />
            </div>
            <div className="strip-text">
              <strong>Context Over Claims</strong>
              <span>Describe what you actually built, your role, and what broke.</span>
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-icon-box">
              <Link2 size={18} />
            </div>
            <div className="strip-text">
              <strong>Attach The Proof</strong>
              <span>Add links to GitHub commits, deployed sites, or certifications.</span>
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-icon-box">
              <Globe size={18} />
            </div>
            <div className="strip-text">
              <strong>One Clean Showcase</strong>
              <span>Give reviewers a single, beautiful link at /u/your-handle.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header-center">
            <div className="section-eyebrow">SIMPLE WORKFLOW</div>
            <h2 className="section-headline">
              Turn hard work into an <span className="headline-highlight">irrefutable record.</span>
            </h2>
            <p className="section-subtext">
              Resumes tell people what you want them to believe. Portivue lets them inspect the code, demo, and timeline.
            </p>
          </div>

          <div className="steps-cards-grid">
            <div className="step-feature-card">
              <span className="step-num-pill">01 / PROFILE</span>
              <div className="step-card-icon-wrap">
                <GraduationCap size={24} />
              </div>
              <h3 className="step-card-title">Define Your Focus</h3>
              <p className="step-card-desc">
                Introduce yourself, your academic background, and the tech stack you’re actively learning and deploying.
              </p>
            </div>

            <div className="step-feature-card">
              <span className="step-num-pill">02 / EVIDENCE</span>
              <div className="step-card-icon-wrap">
                <Link2 size={24} />
              </div>
              <h3 className="step-card-title">Link Inspectable Receipts</h3>
              <p className="step-card-desc">
                Attach repository URLs, live demo links, or credentials. Missing a link? Label it self-reported with transparent honesty.
              </p>
            </div>

            <div className="step-feature-card">
              <span className="step-num-pill">03 / SHOWCASE</span>
              <div className="step-card-icon-wrap">
                <Globe size={24} />
              </div>
              <h3 className="step-card-title">Share Your Public Link</h3>
              <p className="step-card-desc">
                Send your unique portfolio URL to hiring managers, hackathon teammates, and mentors for effortless review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="transparency-section" id="transparency">
        <div className="transparency-card-box">
          <div className="transparency-icon-box">
            <ShieldCheck size={28} />
          </div>
          <div className="transparency-content">
            <span className="transparency-badge">TRANSPARENT BY DESIGN</span>
            <h3 className="transparency-title">Honest proof beats inflated credentials.</h3>
            <p className="transparency-desc">
              We never fabricate verification badges. Entries with external links are labeled <strong>Evidence linked</strong> for immediate inspection, while non-linked entries remain transparently marked <strong>Self-reported</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Sample Showcase Banner */}
      <section className="sample-invite-section">
        <div className="sample-invite-card">
          <div className="sample-invite-content">
            <div className="section-eyebrow">READY TO EXPLORE?</div>
            <h2 className="sample-invite-title">See how a finished portfolio looks.</h2>
            <p className="sample-invite-desc">
              Inspect an illustrative student record with sample projects, hackathon prototypes, and certificates.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-lg"
            onClick={onSample}
          >
            <span>View Sample Portfolio</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="final-cta-section">
        <div className="cta-spark-circle">
          <Sparkles size={22} />
        </div>
        <h2 className="final-cta-headline">Let your code speak for you.</h2>
        <p className="final-cta-subtext">
          Start building your student portfolio today with Portivue.
        </p>
        <button
          type="button"
          className="btn-primary btn-lg"
          onClick={() => onAuth("signup")}
        >
          <span>Get Started Free</span>
          <ArrowUpRight size={17} />
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} size="small" />
          <span className="footer-copyright">
            Portivue © 2026. Built with intention for student builders.
          </span>
          <button
            type="button"
            className="footer-sample-link"
            onClick={onSample}
          >
            View Sample Showcase
          </button>
        </div>
      </footer>
    </div>
  );
}

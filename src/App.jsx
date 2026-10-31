import React, { useEffect, useState, useCallback } from "react";
import { CircleHelp, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "./supabase";
import { SAMPLE } from "./constants";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import PublicPortfolio from "./components/PublicPortfolio";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'signin' | 'signup' | null
  const [page, setPage] = useState("home"); // 'home' | 'dashboard' | 'sample' | 'public'
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicEntries, setPublicEntries] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ message: "", type: "success" });
  }, []);

  // Listen to Supabase Auth state
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
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

  // Client-side routing helper
  const navigate = useCallback((path, nextPage) => {
    window.history.pushState({}, "", path);
    setPage(nextPage);
    if (nextPage === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Fetch real public profile from Supabase
  const loadPublic = useCallback(async (username) => {
    if (!isSupabaseConfigured || !supabase) {
      setNotice("Supabase credentials not configured in .env.local.");
      setPage("home");
      return;
    }

    setLoadingPublic(true);
    try {
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (pErr || !p) {
        setNotice(pErr?.message || `Portfolio for “@${username}” was not found.`);
        setPage("home");
        return;
      }

      // Fetch entries; try with is_public filter first, fallback gracefully
      let { data: entries, error: eErr } = await supabase
        .from("portfolio_entries")
        .select("*")
        .eq("user_id", p.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      // Fallback if is_public column doesn't exist
      if (eErr && eErr.message && eErr.message.includes("is_public")) {
        const fallbackRes = await supabase
          .from("portfolio_entries")
          .select("*")
          .eq("user_id", p.id)
          .order("created_at", { ascending: false });
        entries = fallbackRes.data;
        eErr = fallbackRes.error;
      }

      if (eErr) {
        setNotice(eErr.message);
        setPage("home");
        return;
      }

      setPublicProfile(p);
      setPublicEntries(entries || []);
      setPage("public");
      setNotice("");
    } catch (err) {
      setNotice(err.message || "Failed to load public portfolio.");
      setPage("home");
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  // URL Path Listener
  useEffect(() => {
    function evaluatePath() {
      const path = window.location.pathname;

      if (path === "/sample") {
        setPage("sample");
      } else if (path === "/dashboard") {
        setPage("dashboard");
      } else if (path.startsWith("/u/")) {
        const username = decodeURIComponent(path.slice(3));
        if (username === SAMPLE.username) {
          setPage("sample");
        } else {
          loadPublic(username);
        }
      } else {
        setPage("home");
      }
    }

    evaluatePath();
    window.addEventListener("popstate", evaluatePath);
    return () => window.removeEventListener("popstate", evaluatePath);
  }, [loadPublic]);

  // Sign out
  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    showToast("Signed out successfully.");
    navigate("/", "home");
  }

  // Initial Auth Boot Screen
  if (!authReady) {
    return (
      <div className="boot-loading-screen">
        <div className="boot-brand-mark">
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
          <span className="dot dot-4" />
        </div>
        <p className="boot-text">Initializing Portivue...</p>
      </div>
    );
  }

  if (loadingPublic) {
    return (
      <div className="boot-loading-screen">
        <div className="boot-brand-mark">
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
          <span className="dot dot-4" />
        </div>
        <p className="boot-text">Loading student portfolio...</p>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification Container */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Global Config Notice */}
      {!isSupabaseConfigured && (
        <div className="config-banner-alert">
          <CircleHelp size={15} />
          <span>
            Supabase is in demo mode. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable cloud accounts.
          </span>
        </div>
      )}

      {/* Global Notice Alert */}
      {notice && (
        <div className="notification-banner-alert">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. Sample Portfolio View */}
      {page === "sample" && (
        <PublicPortfolio
          profile={SAMPLE}
          entries={SAMPLE.entries}
          sample={true}
          onBack={() => navigate("/", "home")}
          onBuildOwn={() => {
            navigate("/", "home");
            setAuthMode("signup");
          }}
        />
      )}

      {/* 2. Real User Public Portfolio View */}
      {page === "public" && (
        <PublicPortfolio
          profile={publicProfile}
          entries={publicEntries}
          sample={false}
          onBack={() => navigate("/", "home")}
          onBuildOwn={() => {
            navigate("/", "home");
            setAuthMode("signup");
          }}
        />
      )}

      {/* 3. Authenticated SaaS Dashboard View */}
      {page === "dashboard" && user && (
        <Dashboard
          user={user}
          onSignOut={handleSignOut}
          onHome={() => navigate("/", "home")}
          onViewPublic={(p, e) => {
            setPublicProfile(p);
            // Show only public entries on preview
            const pubOnly = e.filter(entry => entry.is_public !== false);
            setPublicEntries(pubOnly);
            navigate(`/u/${p.username}`, "public");
          }}
          showToast={showToast}
        />
      )}

      {/* 4. Public Landing Page */}
      {page !== "sample" && page !== "public" && (page !== "dashboard" || !user) && (
        <>
          <Landing
            onAuth={mode => setAuthMode(mode)}
            onSample={() => navigate("/sample", "sample")}
            user={user}
            onDashboard={() => navigate("/dashboard", "dashboard")}
          />

          {authMode && (
            <AuthModal
              mode={authMode}
              setMode={setAuthMode}
              onClose={() => setAuthMode(null)}
              onSuccess={signedInUser => {
                setUser(signedInUser);
                setAuthMode(null);
                showToast(`Welcome, ${signedInUser.user_metadata?.full_name || signedInUser.email}!`);
                navigate("/dashboard", "dashboard");
              }}
            />
          )}
        </>
      )}
    </>
  );
}

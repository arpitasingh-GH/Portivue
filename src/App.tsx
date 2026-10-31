import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bot,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  Code2,
  Cpu,
  ExternalLink,
  Eye,
  FolderOpen,
  GraduationCap,
  LogIn,
  LogOut,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { DEMO_ENTRIES, DEMO_PROFILE } from './data/demoPortfolio';
import { getCurrentAccount, registerAccount, saveAccount, signIn, signOut, type LocalAccount } from './lib/localAccounts';
import { isValidHttpUrl, isValidUsername } from './utils/validation';
import type { EntryCategory, PortfolioEntry } from './types/portfolio';
import { GemmaChatbot } from './components/GemmaChatbot';
import {
  polishBioWithGemma,
  polishProjectDescriptionWithGemma,
  getStoredGemmaConfig,
  SUPPORTED_LIGHTWEIGHT_MODELS,
} from './lib/gemmaAdapter';

const categories: Array<'All' | EntryCategory> = [
  'All',
  'Projects',
  'Certificates',
  'Hackathons',
  'Achievements',
  'Internships',
  'Other',
];

const entryCategories = categories.filter((category): category is EntryCategory => category !== 'All');

const categoryIcons: Record<EntryCategory, typeof Code2> = {
  Projects: Code2,
  Certificates: Award,
  Hackathons: Sparkles,
  Achievements: Award,
  Internships: BriefcaseBusiness,
  Other: GraduationCap,
};

type Screen = 'home' | 'auth' | 'dashboard' | 'portfolio';
type AuthMode = 'register' | 'signin';

function BrandMark() {
  return (
    <svg viewBox="0 0 44 44" className="brand-mark" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="16.5" fill="none" stroke="currentColor" strokeOpacity=".2" />
      <path
        d="M12.5 15.5c3.5-.8 6.7.1 9.5 2.4v12c-2.8-2.3-6-3.1-9.5-2.4zm19 0c-3.5-.8-6.7.1-9.5 2.4v12c2.8-2.3 6-3.1 9.5-2.4z"
        fill="currentColor"
        fillOpacity=".1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m17 23 3 2 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 9.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RobotFace() {
  return (
    <svg viewBox="0 0 48 48" className="robot-face" role="img" aria-label="Gemma AI Bot">
      <path d="M24 7V4m0 0a2 2 0 1 0 0 .1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="8" y="12" width="32" height="27" rx="10" fill="var(--robot-face-fill)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M4.5 21v9m39-9v9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="24" r="2.3" fill="#d4af7f" />
      <circle cx="30" cy="24" r="2.3" fill="#d4af7f" />
      <path d="M18 31c1.7 2 3.7 3 6 3s4.3-1 6-3" fill="none" stroke="#d4af7f" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="30" r="1.5" fill="#fff" />
      <circle cx="36" cy="30" r="1.5" fill="#fff" />
    </svg>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [activeCategory, setActiveCategory] = useState<'All' | EntryCategory>('All');
  const [selectedEntryCategory, setSelectedEntryCategory] = useState<EntryCategory>('Projects');
  const [isDemo, setIsDemo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Gemma 4 AI Assistant states
  const [isGemmaChatOpen, setIsGemmaChatOpen] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [isPolishingBio, setIsPolishingBio] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryOutcome, setEntryOutcome] = useState('');
  const [entryEvidenceUrl, setEntryEvidenceUrl] = useState('');
  const [isEnhancingEntry, setIsEnhancingEntry] = useState(false);

  useEffect(() => {
    try {
      const currentAccount = getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
        setBioInput(currentAccount.profile.bio || '');
        setSkillsInput(currentAccount.profile.skills.join(', ') || '');
        setScreen('dashboard');
      }
    } catch (storageError) {
      setError(storageError instanceof Error ? storageError.message : 'Could not load browser data.');
    }
  }, []);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setError('');
    setMessage('');
    setScreen('auth');
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');
      let nextAccount: LocalAccount;
      if (authMode === 'register') {
        const fullName = String(formData.get('fullName') ?? '').trim();
        const username = String(formData.get('username') ?? '').trim().toLowerCase();
        const usernameValidation = isValidUsername(username);
        if (!usernameValidation.valid) throw new Error(usernameValidation.message);
        nextAccount = await registerAccount({ email, password, fullName, username });
        setMessage('Your portfolio is ready. Add a project or update your profile below.');
      } else {
        nextAccount = await signIn(email, password);
      }
      setAccount(nextAccount);
      setBioInput(nextAccount.profile.bio || '');
      setSkillsInput(nextAccount.profile.skills.join(', ') || '');
      setIsDemo(false);
      setScreen('dashboard');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not complete that request.');
    } finally {
      setIsSaving(false);
    }
  }

  function updateAccount(nextAccount: LocalAccount, successMessage: string) {
    setError('');
    setMessage('');
    try {
      const saved = saveAccount(nextAccount);
      setAccount(saved);
      setMessage(successMessage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your changes.');
    }
  }

  function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const username = String(formData.get('username') ?? '').trim().toLowerCase();
    const bio = bioInput.trim();
    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 20);
    const validation = isValidUsername(username);
    if (!validation.valid) {
      setError(validation.message);
      setMessage('');
      return;
    }
    updateAccount(
      { ...account, profile: { ...account.profile, full_name: fullName, username, bio, skills } },
      'Profile saved successfully.',
    );
  }

  async function handlePolishBioWithGemma() {
    if (!account) return;
    setIsPolishingBio(true);
    setError('');
    try {
      const res = await polishBioWithGemma(bioInput, {
        profile: account.profile,
        entries: account.entries,
      });
      setBioInput(res.polished);
      setMessage(`Bio polished with Gemma 4 (${res.latencyMs}ms · ${res.source}). Click 'Save profile' to keep.`);
    } catch (polishError) {
      setError(polishError instanceof Error ? polishError.message : 'Could not polish bio with Gemma 4 right now.');
    } finally {
      setIsPolishingBio(false);
    }
  }

  async function handleEnhanceEntryWithGemma() {
    if (!account) return;
    setIsEnhancingEntry(true);
    setError('');
    try {
      const res = await polishProjectDescriptionWithGemma(
        entryTitle || 'Portfolio Project',
        entryDesc || 'Designed and developed a student software solution.',
        selectedEntryCategory,
        {
          profile: account.profile,
          entries: account.entries,
        }
      );
      setEntryDesc(res.polished);
      if (!entryOutcome.trim()) {
        setEntryOutcome(res.suggestedOutcome);
      }
      setMessage('Entry description enhanced with Gemma 4 STAR framework.');
    } catch (enhanceError) {
      setError(enhanceError instanceof Error ? enhanceError.message : 'Could not enhance entry with Gemma 4 right now.');
    } finally {
      setIsEnhancingEntry(false);
    }
  }

  function handleAddEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setError('');
    setMessage('');
    const title = entryTitle.trim();
    const description = entryDesc.trim();
    const outcome = entryOutcome.trim();
    const categoryValue = selectedEntryCategory;
    const evidenceInput = entryEvidenceUrl.trim();
    const formData = new FormData(event.currentTarget);
    const visibility = String(formData.get('visibility') ?? 'public');

    if (!title || !description || !outcome) {
      setError('Add a title, description, and outcome before saving this entry.');
      return;
    }
    const category = entryCategories.find((item) => item === categoryValue);
    if (!category) {
      setError('Choose a valid portfolio category.');
      return;
    }
    if (evidenceInput && !isValidHttpUrl(evidenceInput)) {
      setError('Enter a complete link that starts with http:// or https://.');
      return;
    }
    if (visibility !== 'public' && visibility !== 'private') {
      setError('Choose whether this entry should be public or private.');
      return;
    }
    const now = new Date().toISOString();
    const entry: PortfolioEntry = {
      id: crypto.randomUUID(),
      user_id: account.id,
      title,
      description,
      outcome,
      category,
      evidence_url: evidenceInput || null,
      evidence_type: evidenceInput ? 'Link' : null,
      is_published: visibility === 'public',
      created_at: now,
      updated_at: now,
    };
    updateAccount(
      { ...account, entries: [entry, ...account.entries] },
      `Portfolio item added as ${visibility}.`,
    );
    // Reset entry inputs
    setEntryTitle('');
    setEntryDesc('');
    setEntryOutcome('');
    setEntryEvidenceUrl('');
  }

  function removeEntry(entryId: string) {
    if (!account) return;
    updateAccount(
      { ...account, entries: account.entries.filter((entry) => entry.id !== entryId) },
      'Portfolio item removed.',
    );
  }

  function openPortfolio(demo: boolean, category: 'All' | EntryCategory = 'All') {
    setIsDemo(demo);
    setActiveCategory(category);
    setError('');
    setMessage('');
    setScreen('portfolio');
  }

  function handleSignOut() {
    try {
      signOut();
      setAccount(null);
      setIsDemo(false);
      setMessage('');
      setError('');
      setScreen('home');
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Could not sign out.');
    }
  }

  const profile = isDemo ? DEMO_PROFILE : account?.profile;
  const portfolioEntries = isDemo ? DEMO_ENTRIES : account?.entries ?? [];
  const visibleEntries = portfolioEntries.filter(
    (entry) => entry.is_published && (activeCategory === 'All' || entry.category === activeCategory),
  );

  const activeGemmaConfig = getStoredGemmaConfig();
  const currentModelOption =
    SUPPORTED_LIGHTWEIGHT_MODELS.find((m) => m.id === activeGemmaConfig.model) ||
    SUPPORTED_LIGHTWEIGHT_MODELS[0];

  return (
    <main className="light-theme min-h-screen bg-[#faf9f7] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            className="text-xl font-bold tracking-tight"
            onClick={() => {
              setScreen('home');
              setIsDemo(false);
              setError('');
            }}
            aria-label="Portivue home"
          >
            <span className="inline-flex items-center gap-2.5">
              <BrandMark />
              <span className="brand-wordmark">porti<span className="text-indigo-600">vue</span></span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            {screen === 'home' && (
              <>
                <button
                  type="button"
                  className="rounded-full border border-indigo-400 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-zinc-100"
                  onClick={() => openAuth('signin')}
                >
                  <span className="inline-flex items-center gap-2"><LogIn size={16} /> Sign in</span>
                </button>
                <button
                  type="button"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  onClick={() => openAuth('register')}
                >
                  Create portfolio
                </button>
              </>
            )}
            {screen === 'auth' && (
              <button type="button" className="inline-flex items-center gap-2 text-sm text-zinc-600" onClick={() => setScreen('home')}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {screen === 'dashboard' && (
              <>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  onClick={() => setIsGemmaChatOpen(true)}
                >
                  <Bot size={15} /> Gemma 4 AI
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                  onClick={() => openPortfolio(false)}
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            )}
            {screen === 'portfolio' && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                onClick={() => setScreen(isDemo ? 'home' : 'dashboard')}
              >
                <ArrowLeft size={16} /> {isDemo ? 'Back home' : 'Edit portfolio'}
              </button>
            )}
          </div>
        </nav>
      </header>

      {screen === 'home' && (
        <>
          {error && <p role="alert" className="mx-auto mt-5 max-w-6xl rounded-xl bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-8">{error}</p>}
          <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:py-24">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <Bot size={14} /> Google Gemma 4 via local Ollama
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                  <Zap size={12} className="text-emerald-600" /> Local inference after setup
                </span>
              </div>
              <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Make your next opportunity <span className="text-indigo-600">find you.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-600">
                Build an honest, evidence-backed student portfolio. Connect a local Gemma 4 model through Ollama for AI assistance.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700"
                  onClick={() => openAuth('register')}
                >
                  Make your portfolio <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  className="rounded-full border border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-700 hover:bg-zinc-50"
                  onClick={() => openPortfolio(true)}
                >
                  Explore sample
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/60 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-100/70"
                  onClick={() => setIsGemmaChatOpen(true)}
                >
                  <Bot size={17} /> Try Gemma 4 Assistant
                </button>
              </div>
              <p className="mt-5 text-xs leading-5 text-zinc-500">
                Without Ollama, the assistant uses fixed offline examples that are clearly marked as not AI-generated.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-4 rounded-[2rem] bg-indigo-100/70 blur-2xl" aria-hidden="true" />
              <div className="relative rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-indigo-950/5 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-500">PORTFOLIO PREVIEW</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Evidence links</span>
                </div>
                <div className="mt-7 flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700">AS</div>
                  <div>
                    <p className="text-lg font-bold">Arjun Shrivastava</p>
                    <p className="text-sm text-zinc-500">Aspiring software engineer</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-zinc-600">
                  Example bio: Building accessible web tools and learning about local AI.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Portfolio project', Icon: Code2, category: 'Projects' as const },
                    { label: 'Web certificate', Icon: Award, category: 'Certificates' as const },
                    { label: 'Campus hackathon', Icon: Sparkles, category: 'Hackathons' as const },
                    { label: 'Student achievement', Icon: GraduationCap, category: 'Achievements' as const },
                  ].map(({ label, Icon, category }, index) => (
                    <button
                      type="button"
                      key={label}
                      aria-label={`View sample ${label}`}
                      onClick={() => openPortfolio(true, category)}
                      className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      <span className="text-xs font-medium text-indigo-600">0{index + 1}</span>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold"><Icon size={16} className="text-indigo-600" />{label}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
                  <Check size={16} className="text-emerald-600" /> Honest evidence labels. Zero false claims.
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-zinc-200/80 bg-white">
            <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:px-8 md:grid-cols-3">
              {[
                { number: '01', title: 'Optional local Gemma 4', description: 'Connect Google Gemma 4 through Ollama for AI chat and writing help.', Icon: Bot },
                { number: '02', title: 'Honest Evidence Attribution', description: 'Clear distinction between verified URL artifacts and self-reported work.', Icon: Check },
                { number: '03', title: 'Transparent offline demo', description: 'Without Ollama, fixed examples are labeled as demos—not AI responses.', Icon: Cpu },
              ].map(({ number, title, description, Icon }) => (
                <div key={number} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={18} /></span>
                  <div>
                    <h2 className="font-semibold"><span className="mr-2 text-xs text-indigo-600">{number}</span>{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {screen === 'auth' && (
        <section className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-9">
            <span className="text-sm font-semibold text-indigo-700">{authMode === 'register' ? 'GET STARTED' : 'WELCOME BACK'}</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {authMode === 'register' ? 'Create your portfolio' : 'Sign in'}
            </h1>
            <p className="mt-2 text-zinc-600">
              {authMode === 'register'
                ? 'Set up your local account, then add your first project.'
                : 'Sign in to the account saved in this browser.'}
            </p>
            <form className="mt-7 space-y-4" onSubmit={handleAuth}>
              {authMode === 'register' && (
                <>
                  <label className="block text-sm font-medium">
                    Full name
                    <input
                      name="fullName"
                      required
                      maxLength={80}
                      autoComplete="name"
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Portfolio username
                    <input
                      name="username"
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*"
                      autoComplete="username"
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="your-name"
                    />
                    <span className="mt-1 block text-xs font-normal text-zinc-500">Use letters, numbers, and single hyphens.</span>
                  </label>
                </>
              )}
              <label className="block text-sm font-medium">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="At least 8 characters"
                />
              </label>
              <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Local prototype mode: your account is stored securely in this browser with zero external tracking.
              </p>
              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-zinc-600">
              {authMode === 'register' ? 'Already created an account here?' : 'New to Portivue?'}{' '}
              <button
                type="button"
                className="font-semibold text-indigo-700 hover:text-indigo-900"
                onClick={() => {
                  setAuthMode(authMode === 'register' ? 'signin' : 'register');
                  setError('');
                }}
              >
                {authMode === 'register' ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </section>
      )}

      {screen === 'dashboard' && account && (
        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-700">YOUR WORKSPACE</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Hi, {account.profile.full_name || 'there'}.</h1>
              <p className="mt-2 text-zinc-600">Update your profile and connect local Gemma 4 in the assistant settings.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsGemmaChatOpen(true)}
              className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-indigo-800 hover:to-indigo-700"
            >
              <Bot size={16} /> Open Gemma 4 Assistant
            </button>
          </div>

          {/* Gemma 4 Assistant Banner Card */}
          <div className="mb-6 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-white to-zinc-50 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900">Gemma 4 Assistant</h3>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                      {currentModelOption.name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {account.entries.length} items logged ({account.entries.filter((e) => e.evidence_url).length} evidence URLs linked).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGemmaChatOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  <Sparkles size={14} /> Audit My Portfolio
                </button>
              </div>
            </div>
          </div>

          {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Profile Form */}
            <form className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleProfileSave}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold"><UserRound size={19} className="text-indigo-600" /> Profile details</h2>
              </div>

              <label className="mt-5 block text-sm font-medium">
                Full name
                <input name="fullName" defaultValue={account.profile.full_name} required maxLength={80} className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" />
              </label>

              <label className="mt-4 block text-sm font-medium">
                Username
                <input name="username" defaultValue={account.profile.username} required minLength={3} maxLength={30} className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" />
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Short bio</label>
                  <button
                    type="button"
                    onClick={handlePolishBioWithGemma}
                    disabled={isPolishingBio}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
                    title="Polish with Gemma 4"
                  >
                    <Sparkles size={13} /> {isPolishingBio ? 'Polishing...' : '✨ Polish with Gemma 4'}
                  </button>
                </div>
                <textarea
                  name="bio"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  maxLength={300}
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500"
                  placeholder="A few lines about you and what you enjoy making."
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Skills <span className="font-normal text-zinc-500">(comma-separated)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsGemmaChatOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 transition hover:underline"
                  >
                    <Bot size={13} /> Suggest skills
                  </button>
                </div>
                <input
                  name="skills"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  maxLength={300}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500"
                  placeholder="React, TypeScript, Gemma AI, Tailwind"
                />
              </div>

              <button type="submit" className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                Save profile
              </button>
            </form>

            {/* Add Entry & Items List */}
            <div className="space-y-6">
              <form className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleAddEntry}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Add entry</h2>
                  <button
                    type="button"
                    onClick={handleEnhanceEntryWithGemma}
                    disabled={isEnhancingEntry}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition disabled:opacity-50"
                  >
                    <Wand2 size={13} /> {isEnhancingEntry ? 'Polishing...' : '✨ Enhance with Gemma (STAR)'}
                  </button>
                </div>
                <p className="mt-1 text-sm text-zinc-600">Add a project, certificate, or hackathon and describe what you achieved.</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium sm:col-span-2">
                    Title
                    <input
                      name="title"
                      value={entryTitle}
                      onChange={(e) => setEntryTitle(e.target.value)}
                      required
                      maxLength={120}
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500"
                      placeholder="e.g. Real-time Edge AI Portfolio"
                    />
                  </label>

                  <fieldset className="sm:col-span-2">
                    <legend className="text-sm font-medium">Choose entry type</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {entryCategories.map((category) => {
                        const Icon = categoryIcons[category];
                        const selected = selectedEntryCategory === category;
                        return (
                          <button
                            key={category}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedEntryCategory(category)}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                              selected
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            <Icon size={17} aria-hidden="true" />
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <label className="text-sm font-medium sm:col-span-2">
                    Evidence URL <span className="font-normal text-zinc-500">(GitHub repo, deployment, certificate)</span>
                    <input
                      name="evidenceUrl"
                      type="url"
                      value={entryEvidenceUrl}
                      onChange={(e) => setEntryEvidenceUrl(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500"
                      placeholder="https://github.com/username/project"
                    />
                  </label>

                  <label className="text-sm font-medium sm:col-span-2">
                    Description
                    <textarea
                      name="description"
                      value={entryDesc}
                      onChange={(e) => setEntryDesc(e.target.value)}
                      required
                      maxLength={1000}
                      rows={3}
                      className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500"
                      placeholder="Describe what you built, technologies used, and the problem solved."
                    />
                  </label>

                  <label className="text-sm font-medium sm:col-span-2">
                    Outcome <span className="font-normal text-zinc-500">(Quantified results, lessons learned)</span>
                    <textarea
                      name="outcome"
                      value={entryOutcome}
                      onChange={(e) => setEntryOutcome(e.target.value)}
                      required
                      maxLength={500}
                      rows={2}
                      className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500"
                      placeholder="e.g. Achieved <50ms inference latency, verified with 100% test coverage."
                    />
                  </label>

                  <label className="text-sm font-medium sm:col-span-2">
                    Visibility
                    <select name="visibility" defaultValue="public" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-indigo-500">
                      <option value="public">Public — show on my portfolio</option>
                      <option value="private">Private — only visible in my dashboard</option>
                    </select>
                  </label>
                </div>

                <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                  <Plus size={17} /> Add entry
                </button>
              </form>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><FolderOpen size={19} className="text-indigo-600" /> Your items</h2>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">{account.entries.length} total</span>
                </div>
                {account.entries.length ? (
                  <ul className="mt-4 divide-y divide-zinc-100">
                    {account.entries.map((entry) => (
                      <li key={entry.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                        <div>
                          <span className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                            {entry.category}
                            <span className={`rounded-full px-2 py-0.5 ${entry.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                              {entry.is_published ? 'Public' : 'Private'}
                            </span>
                            {entry.evidence_url && (
                              <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[11px]">
                                Evidence linked
                              </span>
                            )}
                          </span>
                          <h3 className="mt-1 font-semibold">{entry.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{entry.description}</p>
                          {entry.outcome && <p className="mt-2 text-sm text-zinc-600"><span className="font-medium">Outcome:</span> {entry.outcome}</p>}
                        </div>
                        <button type="button" aria-label={`Remove ${entry.title}`} onClick={() => removeEntry(entry.id)} className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={17} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
                    Your portfolio is empty. Add a project, certificate, or achievement to get started.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {screen === 'portfolio' && profile && (
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_2fr] md:py-16">
          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            {isDemo && <span className="mb-5 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">Sample portfolio</span>}
            <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
              {profile.full_name.split(' ').map((part) => part[0]).join('')}
            </div>
            <p className="mb-2 text-sm font-medium text-indigo-700">Student portfolio</p>
            <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
            <p className="mt-1 text-sm text-zinc-500">@{profile.username}</p>
            <p className="mt-5 leading-7 text-zinc-600">{profile.bio || 'This student is building their portfolio.'}</p>
            <div className="mt-7">
              <h2 className="text-sm font-semibold">Skills</h2>
              {profile.skills.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.map((skill) => <li key={skill} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">{skill}</li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-zinc-500">No skills added yet.</p>}
            </div>
            <div className="mt-8 border-t border-zinc-100 pt-5 text-sm text-zinc-500">
              {portfolioEntries.filter((entry) => entry.is_published).length} portfolio items
            </div>
          </aside>
          <section aria-labelledby="work-heading">
            <div className="mb-7">
              <p className="text-sm font-medium text-indigo-700">{isDemo ? 'Explore the work' : 'Portfolio preview'}</p>
              <h2 id="work-heading" className="mt-1 text-3xl font-bold tracking-tight">Projects & achievements</h2>
              <p className="mt-2 text-zinc-600">A snapshot of learning, building, and sharing.</p>
            </div>
            <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter portfolio items">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleEntries.map((entry) => {
                const Icon = categoryIcons[entry.category];
                return (
                  <article key={entry.id} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">{entry.category}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{entry.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">{entry.description}</p>
                    {entry.outcome && (
                      <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                        <span className="font-semibold">Outcome:</span> {entry.outcome}
                      </p>
                    )}
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                      <span className="text-xs font-medium text-emerald-700">
                        {entry.evidence_type === 'Course information—not certificate evidence'
                          ? 'Course information only'
                          : entry.evidence_url
                            ? 'Evidence linked'
                            : 'Self-reported'}
                      </span>
                      {entry.evidence_url && (
                        <a className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900" href={entry.evidence_url} target="_blank" rel="noreferrer">
                          {entry.evidence_type === 'Course information—not certificate evidence' ? 'View course info' : 'View evidence'} <ExternalLink size={14} aria-hidden="true" />
                          <span className="sr-only"> for {entry.title}</span>
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {visibleEntries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
                No published items in this category yet.
              </div>
            )}
            {!isDemo && (
              <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                This preview is stored locally and is not a public URL yet. Sign-in and online sharing need a backend before launch.
              </p>
            )}
          </section>
        </section>
      )}

      {/* Gemma 4 AI Assistant Chatbot */}
      <GemmaChatbot
        account={account}
        activeCategory={activeCategory}
        onUpdateBio={(newBio) => {
          if (account) {
            setBioInput(newBio);
            updateAccount(
              { ...account, profile: { ...account.profile, bio: newBio } },
              'Bio updated from Gemma 4 suggestion.'
            );
          }
        }}
        onAddSkills={(newSkills) => {
          if (account) {
            const merged = Array.from(new Set([...account.profile.skills, ...newSkills])).slice(0, 20);
            setSkillsInput(merged.join(', '));
            updateAccount(
              { ...account, profile: { ...account.profile, skills: merged } },
              'Skills updated from Gemma 4 suggestion.'
            );
          }
        }}
        isOpen={isGemmaChatOpen}
        onToggle={() => setIsGemmaChatOpen((prev) => !prev)}
      />

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Built with Portivue — optional local Gemma 4 inference through Ollama.</p>
          {screen === 'home' ? (
            <button type="button" className="inline-flex items-center gap-1 hover:text-indigo-700" onClick={() => openPortfolio(true)}>
              Explore sample portfolio <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          ) : screen === 'dashboard' ? (
            <button type="button" className="inline-flex items-center gap-1 hover:text-indigo-700" onClick={() => openPortfolio(false)}>
              Preview portfolio <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1">Made for your next chapter <GraduationCap size={15} aria-hidden="true" /></span>
          )}
        </div>
      </footer>
    </main>
  );
}

export default App;

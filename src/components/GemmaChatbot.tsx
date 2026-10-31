import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Settings2,
  Trash2,
  Check,
  Cpu,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Bot,
} from 'lucide-react';
import {
  chatWithGemma,
  getStoredGemmaConfig,
  saveStoredGemmaConfig,
  SUPPORTED_LIGHTWEIGHT_MODELS,
  type GemmaAdapterConfig,
  type GemmaInferenceResult,
  type GemmaModelId,
  type StudentContext,
} from '../lib/gemmaAdapter';
import type { LocalAccount } from '../lib/localAccounts';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  source?: GemmaInferenceResult['source'];
  latencyMs?: number;
  model?: string;
  suggestedAction?: GemmaInferenceResult['suggestedAction'];
}

interface GemmaChatbotProps {
  account: LocalAccount | null;
  activeCategory: string;
  onUpdateBio?: (newBio: string) => void;
  onAddSkills?: (newSkills: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function GemmaChatbot({
  account,
  activeCategory,
  onUpdateBio,
  onAddSkills,
  isOpen,
  onToggle,
}: GemmaChatbotProps) {
  const [config, setConfig] = useState<GemmaAdapterConfig>(getStoredGemmaConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedActionId, setAppliedActionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Hi! I'm Portivue's portfolio assistant.

To use real Google Gemma 4 responses, install a Gemma 4 model in Ollama and configure its local endpoint in settings. Without an endpoint, I can show fixed offline demo examples; those are not AI-generated.

**How can I help you right now?**
- **Audit your portfolio** — Check completeness and evidence ratio.
- **Write a compelling bio** — Craft a 2-sentence elevator pitch.
- **Polish project descriptions** — Apply the recruiter-friendly STAR framework.
- **Recommend skills** — Discover high-demand tools to showcase.`,
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const studentContext: StudentContext = {
    profile: account?.profile,
    entries: account?.entries,
    activeCategory,
  };

  const currentModelInfo =
    SUPPORTED_LIGHTWEIGHT_MODELS.find((m) => m.id === config.model) ||
    SUPPORTED_LIGHTWEIGHT_MODELS[0];

  function handleConfigChange(updates: Partial<GemmaAdapterConfig>) {
    const nextConfig = { ...config, ...updates };
    setConfig(nextConfig);
    saveStoredGemmaConfig(nextConfig);
  }

  async function sendMessage(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const response = await chatWithGemma(
        [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        studentContext,
        config
      );

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
        source: response.source,
        latencyMs: response.latencyMs,
        model: response.model,
        suggestedAction: response.suggestedAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Gemma inference failed. Check your Ollama settings.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleActionClick(action: NonNullable<GemmaInferenceResult['suggestedAction']>, messageId: string) {
    if (action.type === 'bio' && typeof action.payload === 'string') {
      onUpdateBio?.(action.payload);
      setAppliedActionId(messageId);
    } else if (action.type === 'skills' && Array.isArray(action.payload)) {
      onAddSkills?.(action.payload);
      setAppliedActionId(messageId);
    }
  }

  function renderFormattedContent(text: string) {
    // Basic Markdown formatting helper (headers, bold, lists, quotes)
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="mt-2 text-base font-bold text-zinc-900">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="my-1.5 border-l-2 border-indigo-500 bg-indigo-50/50 py-1 pl-3 pr-2 italic text-zinc-800 rounded-r"
              >
                {trimmed.replace('> ', '')}
              </blockquote>
            );
          }
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
            const itemText = trimmed.replace(/^[•-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="mt-1.5 size-1.5 flex-none rounded-full bg-indigo-600" />
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }
          if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ')) {
            const num = trimmed.slice(0, 3);
            const rest = trimmed.slice(3);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="font-semibold text-indigo-700">{num}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(rest) }} />
              </div>
            );
          }
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
            />
          );
        })}
      </div>
    );
  }

  function formatInlineMarkdown(str: string): string {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono text-indigo-800">$1</code>');
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <section
          aria-label="Portivue portfolio assistant"
          className="gemma-chat-panel mb-3 flex h-[35rem] w-[26rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 shadow-2xl transition-all"
        >
          {/* Header */}
          <header className="gemma-chat-surface flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white shadow-sm">
                <Bot size={20} />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-zinc-900 leading-tight">Portfolio Assistant</h3>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                    {currentModelInfo.name}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <span className={`inline-block size-1.5 rounded-full ${config.endpointUrl.trim() ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                  {config.endpointUrl.trim()
                    ? 'Gemma endpoint configured (not yet verified)'
                    : 'Offline demo only · not AI'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings((prev) => !prev)}
                className={`rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-800 ${
                  showSettings ? 'bg-zinc-200 text-zinc-900' : ''
                }`}
                title="Model & Endpoint Settings"
                aria-label="Settings"
              >
                <Settings2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      role: 'assistant',
                      content: `Chat cleared. Configure Ollama in settings to get real Gemma 4 answers. Without an endpoint, replies are fixed offline demo examples, not AI-generated.`,
                      timestamp: Date.now(),
                    },
                  ]);
                }}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-800"
                title="Clear Chat History"
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-800"
                aria-label="Close Assistant"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Model & Config Settings Drawer */}
          {showSettings && (
            <div className="border-b border-zinc-200 bg-zinc-50/90 p-3.5 text-xs animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 font-semibold text-zinc-800">
                <span className="flex items-center gap-1.5">
                  <Cpu size={14} className="text-indigo-600" /> Local Gemma 4 Setup
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">Ollama</span>
              </div>

              {/* Model Selector */}
              <div className="mb-2.5">
                <label className="block mb-1 font-medium text-zinc-700">Gemma 4 model:</label>
                <select
                  value={config.model}
                  onChange={(e) => handleConfigChange({ model: e.target.value as GemmaModelId })}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                >
                  {SUPPORTED_LIGHTWEIGHT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.tag}) — {m.parameters}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-zinc-500 leading-tight">
                  {currentModelInfo.description}
                </p>
              </div>

              {/* Endpoint URL Input */}
              <div className="mb-2">
                <label className="block mb-0.5 font-medium text-zinc-700">
                  Ollama endpoint <span className="font-normal text-zinc-400">(optional)</span>:
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434/v1"
                  value={config.endpointUrl}
                  onChange={(e) => handleConfigChange({ endpointUrl: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-indigo-500"
                />
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  Use http://localhost:11434/v1 for Ollama. Blank means fixed offline demo replies, not Gemma.
                </p>
                <p className="mt-1 text-[10px] text-amber-800">
                  Prompts and portfolio context are sent to this endpoint. Prefer localhost; do not enter production API keys in this browser app.
                </p>
              </div>

              {/* Session API Key if live */}
              {config.endpointUrl.trim() && (
                <div className="mb-2">
                  <label className="block mb-0.5 font-medium text-zinc-700">
                    API key <span className="font-normal text-zinc-400">(stored in this browser; never use a production secret here)</span>:
                  </label>
                  <input
                    type="password"
                    placeholder="Bearer token or API Key"
                    value={config.sessionApiKey}
                    onChange={(e) => handleConfigChange({ sessionApiKey: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="gemma-chat-surface flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'gemma-chat-surface border border-zinc-200/90 text-zinc-800 rounded-bl-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}

                  {/* Interactive Action Button (e.g. Apply to Bio / Add Skills) */}
                  {msg.suggestedAction && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleActionClick(msg.suggestedAction!, msg.id)}
                        disabled={appliedActionId === msg.id}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-xs ${
                          appliedActionId === msg.id
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white'
                        }`}
                      >
                        {appliedActionId === msg.id ? (
                          <>
                            <Check size={14} /> Applied to profile!
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} /> {msg.suggestedAction.label}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtitle / Latency / Source */}
                {msg.role === 'assistant' && msg.source && (
                  <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-zinc-600">
                    <span className="flex items-center gap-0.5">
                      <Zap size={11} className="text-amber-500" />
                      {msg.latencyMs ? `${msg.latencyMs}ms` : 'Instant'}
                    </span>
                    <span>•</span>
                    <span>
                      {msg.source === 'gemma-4-live'
                        ? `Gemma 4 · ${msg.model ?? config.model}`
                        : msg.source === 'gemma-4-cache'
                        ? `Gemma 4 cached · ${msg.model ?? config.model}`
                        : 'Offline demo · not AI'}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 py-1">
                <div className="flex size-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 animate-pulse">
                  <Bot size={14} />
                </div>
                <span>{config.endpointUrl.trim() ? 'Gemma 4 is responding...' : 'Loading offline demo...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="gemma-chat-surface border-t border-zinc-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              '🎯 Audit my portfolio',
              '✨ Help with my bio',
              '🚀 Polish project with STAR',
              '💡 Recommend skills',
              '🏆 Hackathon tips',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => sendMessage(chip)}
                disabled={isGenerating}
                className="whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="gemma-chat-surface flex items-center gap-2 border-t border-zinc-200 p-2.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your portfolio..."
              disabled={isGenerating}
              className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="inline-flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
              aria-label="Send Message"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? 'Close portfolio assistant' : 'Open portfolio assistant'}
        className="group relative flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-600 text-white shadow-xl transition-all hover:scale-105 hover:shadow-indigo-300/40 active:scale-95"
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <>
            <Bot size={26} className="transition-transform group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-extrabold text-white shadow-sm ring-2 ring-white">
              G4
            </span>
          </>
        )}
      </button>
    </div>
  );
}

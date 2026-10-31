/**
 * Gemma 4 adapter for local Ollama inference, with clearly labeled offline demo replies.
 */

import type { EntryCategory, PortfolioEntry, Profile } from '../types/portfolio';

export type GemmaModelId =
  | 'gemma4:e2b'
  | 'gemma4:e4b'
  | 'gemma4:12b'
  | 'gemma4:26b'
  | 'gemma4:31b';

export interface GemmaModelOption {
  id: GemmaModelId;
  name: string;
  tag: string;
  description: string;
  parameters: string;
  isDefault?: boolean;
}

export const SUPPORTED_LIGHTWEIGHT_MODELS: GemmaModelOption[] = [
  {
    id: 'gemma4:e2b',
    name: 'Gemma 4 E2B',
    tag: 'Edge',
    description: 'Small Gemma 4 variant for local inference on supported devices.',
    parameters: 'E2B',
    isDefault: true,
  },
  {
    id: 'gemma4:e4b',
    name: 'Gemma 4 E4B',
    tag: 'Edge',
    description: 'Larger edge-oriented Gemma 4 variant; needs more memory than E2B.',
    parameters: 'E4B',
  },
  {
    id: 'gemma4:12b',
    name: 'Gemma 4 12B',
    tag: 'Workstation',
    description: 'Workstation-sized Gemma 4 variant for more capable local inference.',
    parameters: '12B',
  },
  {
    id: 'gemma4:26b',
    name: 'Gemma 4 26B',
    tag: 'Workstation',
    description: 'Mixture-of-experts Gemma 4 variant with higher local hardware requirements.',
    parameters: '26B',
  },
  {
    id: 'gemma4:31b',
    name: 'Gemma 4 31B',
    tag: 'Workstation',
    description: 'Dense Gemma 4 variant with substantial local hardware requirements.',
    parameters: '31B',
  },
];

export interface GemmaAdapterConfig {
  enabled: boolean;
  model: GemmaModelId;
  endpointUrl: string;
  sessionApiKey: string;
  temperature: number;
}

const STORAGE_KEY = 'portivue_gemma_adapter_config';

export function getStoredGemmaConfig(): GemmaAdapterConfig {
  const envUrl = (import.meta as any).env?.VITE_GEMMA_ENDPOINT_URL || '';
  const configuredModel = (import.meta as any).env?.VITE_GEMMA_MODEL;
  const envModel =
    SUPPORTED_LIGHTWEIGHT_MODELS.find((model) => model.id === configuredModel)?.id ?? 'gemma4:e2b';
  const defaultConfig: GemmaAdapterConfig = {
    enabled: true,
    model: envModel,
    endpointUrl: envUrl,
    sessionApiKey: '',
    temperature: 0.3,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw);
    const storedModel = SUPPORTED_LIGHTWEIGHT_MODELS.find((model) => model.id === parsed.model)?.id
      ?? defaultConfig.model;
    return {
      ...defaultConfig,
      ...parsed,
      model: storedModel,
      endpointUrl: parsed.endpointUrl !== undefined ? parsed.endpointUrl : envUrl,
    };
  } catch {
    return defaultConfig;
  }
}

export function saveStoredGemmaConfig(config: GemmaAdapterConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save Gemma config:', error);
  }
}

const responseCache = new Map<
  string,
  {
    reply: string;
    source: 'gemma-4-live' | 'offline-demo';
    suggestedAction?: GemmaInferenceResult['suggestedAction'];
  }
>();

export interface StudentContext {
  profile?: Partial<Profile> | null;
  entries?: PortfolioEntry[];
  activeCategory?: string;
}

export interface GemmaInferenceResult {
  reply: string;
  source: 'gemma-4-live' | 'gemma-4-cache' | 'offline-demo';
  latencyMs: number;
  model: string;
  suggestedAction?: {
    type: 'bio' | 'skills' | 'entry';
    payload: string | string[];
    label: string;
  };
}

/**
 * Deterministic text polish fallback (0-latency, pure deterministic)
 */
export const formatTextDeterministically = (
  text: string,
  task: 'bio' | 'description' | 'outcome'
): string => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

/**
 * Fixed example replies for use when no inference endpoint is configured.
 */
export function createOfflineDemoResponse(
  userPrompt: string,
  context: StudentContext
): { reply: string; suggestedAction?: GemmaInferenceResult['suggestedAction'] } {
  const normalized = userPrompt.toLowerCase();
  const profile = context.profile;
  const entries = context.entries || [];
  const studentName = profile?.full_name || 'Student';
  const skills = profile?.skills || [];

  // 1. Portfolio Review / Audit
  if (
    normalized.includes('review') ||
    normalized.includes('audit') ||
    normalized.includes('critique') ||
    normalized.includes('feedback') ||
    normalized.includes('how does my portfolio look')
  ) {
    const totalEntries = entries.length;
    const publishedEntries = entries.filter((e) => e.is_published).length;
    const evidenceCount = entries.filter((e) => Boolean(e.evidence_url)).length;
    const evidenceRatio = totalEntries > 0 ? Math.round((evidenceCount / totalEntries) * 100) : 0;

    let grade = 'B';
    if (totalEntries >= 3 && evidenceRatio >= 66 && profile?.bio) grade = 'A';
    else if (totalEntries >= 4 && evidenceRatio >= 80) grade = 'A+';
    else if (totalEntries === 0) grade = 'In Progress';

    return {
      reply: `### Offline demo: Portfolio audit for ${studentName}

**Demo readiness estimate:** **${grade}** (${evidenceRatio}% of entries have an evidence URL)

**📊 Metric Snapshot:**
- **Total Portfolio Items:** ${totalEntries} (${publishedEntries} visible publicly)
- **Evidence Attached:** ${evidenceCount} of ${totalEntries} (${evidenceRatio}%)
- **Identified Skills:** ${skills.length > 0 ? skills.join(', ') : 'None listed yet'}

**✅ Highlights & Strengths:**
${evidenceCount > 0
  ? `• **Linked evidence:** ${evidenceCount} entry/entries have an evidence URL. Check that each link supports the entry.`
  : `• **Self-reported entries:** Add evidence URLs where available and keep claims accurate.`}
${entries.some((e) => e.category === 'Hackathons') ? '• **Hackathon Drive:** Hackathon participation shows rapid prototyping and team collaboration.' : ''}

**💡 High-Impact Recommendations:**
1. ${evidenceCount < totalEntries ? `**Link Supporting Artifacts:** Add GitHub links, live deployments, or certificates to your ${totalEntries - evidenceCount} self-reported entry/entries.` : '**Diversify Categories:** Try adding a technical achievement, open-source contribution, or internship.'}
2. ${!profile?.bio || profile.bio.length < 50 ? '**Strengthen Elevator Pitch:** Expand your bio into 2 crisp sentences highlighting your tech stack and current goals.' : '**Highlight Outcome Metrics:** Quantify the result of your top project (e.g., users reached, test coverage, load time reduction).'}
3. **Keep Entries Updated:** Regularly publish private drafts as you finish polishing deliverables.`,
    };
  }

  // 2. Bio Assistance / Suggestion
  if (
    normalized.includes('bio') ||
    normalized.includes('about me') ||
    normalized.includes('elevator pitch') ||
    normalized.includes('who i am')
  ) {
    const topSkills = skills.slice(0, 3).join(', ') || 'modern web technologies and software engineering';
    const topProject = entries.find((e) => e.category === 'Projects')?.title || 'practical software projects';
    const suggestion1 = `Aspiring software engineer passionate about building high-impact solutions with ${topSkills}. Creator of ${topProject}, focused on building clean, reliable, and user-centric applications.`;
    const suggestion2 = `Student developer specializing in ${topSkills}. Driven by solving real-world challenges through code, continuous learning, and collaborative hackathons.`;

    return {
      reply: `### Offline demo: Bio suggestions for ${studentName}

Here are two concise, recruiter-ready elevator pitches crafted for your profile:

**Option 1 (Project-Focused):**
> "${suggestion1}"

**Option 2 (Growth & Versatility):**
> "${suggestion2}"

*Tip: Keep your bio concise so hiring managers can understand your strengths at a glance.*`,
      suggestedAction: {
        type: 'bio',
        payload: suggestion1,
        label: 'Apply Option 1 to Bio',
      },
    };
  }

  // 3. Project Description Polish & STAR Method
  if (
    normalized.includes('project') ||
    normalized.includes('star') ||
    normalized.includes('outcome') ||
    normalized.includes('description') ||
    normalized.includes('polish')
  ) {
    return {
      reply: `### Offline demo: Project polish guide (STAR framework)

To make your project stand out to technical reviewers, structure your entry using the **STAR** method:

- **Situation:** What was the context or problem? (e.g., *"Students lacked a clean, verified portfolio platform."*)
- **Task:** What specific feature or system did you set out to build?
- **Action:** Which technologies, frameworks, and architecture patterns did you use?
- **Result & Evidence:** What measurable outcome did you observe? Avoid inventing metrics.

**Note:** This is a fixed offline example, not a model-generated rewrite.`,
    };
  }

  // 4. Skill Recommendations
  if (
    normalized.includes('skill') ||
    normalized.includes('learn') ||
    normalized.includes('what to add') ||
    normalized.includes('recommend')
  ) {
    const recommended = ['TypeScript', 'Tailwind CSS', 'React 18', 'Gemma AI', 'Git & GitHub', 'REST APIs', 'PostgreSQL'];
    const missing = recommended.filter((r) => !skills.map((s) => s.toLowerCase()).includes(r.toLowerCase()));

    return {
      reply: `### Offline demo: Skill ideas

Based on contemporary software engineering standards and student portfolios, here are key skills that boost your marketability:

**High-Demand Core Skills:**
${missing.slice(0, 5).map((s) => `• **${s}** — Highly valued in full-stack and modern frontend engineering.`).join('\n')}

**Portfolio Alignment Strategy:**
1. List 5–8 skills you can defend during a technical interview.
2. Ensure each primary skill has at least one associated project or certificate in your portfolio.
3. Replace generic keywords (e.g., "Computer Skills") with exact frameworks and tools.`,
      suggestedAction: {
        type: 'skills',
        payload: missing.slice(0, 4),
        label: `Add ${missing.slice(0, 4).join(', ')}`,
      },
    };
  }

  // 5. Hackathon Preparation & Strategy
  if (
    normalized.includes('hackathon') ||
    normalized.includes('win') ||
    normalized.includes('pitch') ||
    normalized.includes('judges')
  ) {
    return {
      reply: `### Offline demo: Hackathon planning ideas

Here is how top hackathon teams score highest with judges:

1. **Working Prototype > Unfinished Ambition:**
   Focus on a working user journey and explain what is complete.
2. **Explain your technical choices:**
   Describe the tools you actually used and why they fit the project.
3. **Provide Verifiable Evidence:**
   Include links to real deployments or repositories when you have them.
4. **The 2-Minute Pitch Formula:**
   - **Hook (15s):** The real problem students face.
   - **Solution Demo (60s):** Show the project working and explain the result.
   - **Technical Architecture (30s):** Describe the technologies and architecture you actually used.
   - **Future Vision (15s):** Scalability and real-world adoption.`,
    };
  }

  // 6. Default / Conversational Assistant Reply
  return {
    reply: `Hi ${studentName}! This is Portivue's **offline demo assistant**. These preset examples are not generated by an AI model.

I can help you build an honest, impressive student portfolio that captures recruiters' attention:

- **"Review my portfolio"** — Get an instant completeness audit and readiness rating.
- **"Help with my bio"** — Generate high-impact 2-sentence elevator pitches.
- **"Polish a project"** — Convert descriptions into STAR framework outcomes.
- **"Recommend skills"** — Discover key tools to learn for modern software roles.
- **"Hackathon tips"** — Learn how to pitch your project and impress judges.

What would you like to work on right now?`,
  };
}

/**
 * Uses a configured endpoint for live inference; otherwise returns a labeled offline demo.
 */
export async function chatWithGemma(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  context: StudentContext,
  customConfig?: Partial<GemmaAdapterConfig>
): Promise<GemmaInferenceResult> {
  const startTime = performance.now();
  const config: GemmaAdapterConfig = {
    ...getStoredGemmaConfig(),
    ...customConfig,
  };

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const cacheKey = JSON.stringify([
    config.model,
    config.endpointUrl,
    lastUserMessage.trim(),
    context.profile,
    context.entries,
    context.activeCategory,
  ]);

  // Keep cached answers scoped to the model, endpoint, prompt, and portfolio context.
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey)!;
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      reply: cached.reply,
      source: cached.source === 'gemma-4-live' ? 'gemma-4-cache' : 'offline-demo',
      latencyMs: Math.max(latencyMs, 3),
      model: config.model,
      suggestedAction: cached.suggestedAction,
    };
  }

  // A configured endpoint must return a real model response or report an error.
  if (config.enabled && config.endpointUrl.trim()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.sessionApiKey.trim()) {
        headers['Authorization'] = `Bearer ${config.sessionApiKey.trim()}`;
      }

      // Build context-aware system prompt
      const systemPrompt = `You are Google's Gemma 4, running locally through Ollama as an assistant in Portivue (a student portfolio platform).
Student Name: ${context.profile?.full_name || 'Student'}
Current Skills: ${(context.profile?.skills || []).join(', ')}
Portfolio Items Count: ${(context.entries || []).length}
Active View: ${context.activeCategory || 'Overview'}

Your goal is to provide concise, honest, and high-impact advice on student portfolios, resume bios, projects, certificates, and technical skills.
Always encourage verifiable evidence and never fabricate achievements. Keep answers under 3-4 paragraphs or crisp bullet points.`;

      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      ];

      let endpoint = config.endpointUrl.trim().replace(/\/+$/, '');
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.endsWith('/v1')
          ? `${endpoint}/chat/completions`
          : `${endpoint}/v1/chat/completions`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model,
          messages: formattedMessages,
          temperature: config.temperature ?? 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        throw new Error(`Ollama returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
      }

      const data = await response.json();
      const reply =
        data?.choices?.[0]?.message?.content?.trim() ||
        data?.response?.trim() ||
        data?.content?.trim();

      if (!reply) {
        throw new Error('Ollama returned an empty response.');
      }

      const latencyMs = Math.round(performance.now() - startTime);
      responseCache.set(cacheKey, { reply, source: 'gemma-4-live' });
      return {
        reply,
        source: 'gemma-4-live',
        latencyMs,
        model: config.model,
      };
    } catch (inferenceError) {
      console.error('Gemma inference failed:', inferenceError);
      const detail = inferenceError instanceof Error ? inferenceError.message : 'Unknown connection error';
      throw new Error(
        `Gemma could not respond. Check that Ollama is running, the selected model is installed, and its local API is reachable. ${detail}`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const demo = createOfflineDemoResponse(lastUserMessage, context);
  const latencyMs = Math.round(performance.now() - startTime);
  responseCache.set(cacheKey, {
    reply: demo.reply,
    source: 'offline-demo',
    suggestedAction: demo.suggestedAction,
  });

  return {
    reply: demo.reply,
    source: 'offline-demo',
    latencyMs,
    model: config.model,
    suggestedAction: demo.suggestedAction,
  };
}

/**
 * Dedicated single-field polish helpers for dashboard forms
 */
export async function polishBioWithGemma(
  currentBio: string,
  context: StudentContext
): Promise<{ polished: string; source: string; latencyMs: number }> {
  const prompt = currentBio.trim()
    ? `Rewrite and polish this student bio to be concise, professional, and impactful (max 2 sentences): "${currentBio}"`
    : `Generate a strong 2-sentence bio for a student with skills in ${(context.profile?.skills || []).join(', ') || 'software development'}.`;

  const res = await chatWithGemma([{ role: 'user', content: prompt }], context);
  if (res.source === 'offline-demo') {
    throw new Error('Start Ollama and install a Gemma 4 model to use AI bio polishing.');
  }
  // Extract quote or clean up
  let cleaned = res.reply.replace(/###.*?\n/g, '').replace(/>/g, '').replace(/"/g, '').trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  if (sentences.length > 2) {
    cleaned = sentences.slice(0, 2).join(' ');
  }
  return {
    polished: cleaned || formatTextDeterministically(currentBio, 'bio'),
    source: res.source,
    latencyMs: res.latencyMs,
  };
}

export async function polishProjectDescriptionWithGemma(
  title: string,
  description: string,
  category: EntryCategory,
  context: StudentContext
): Promise<{ polished: string; suggestedOutcome: string; source: string }> {
  const prompt = `Improve this ${category} entry titled "${title}". Description: "${description}". Return exactly two lines:
Description: <a concise, truthful two-sentence description>
Outcome: <a measurable result only if supplied in the original; otherwise state what evidence the student should add>
Do not invent metrics, achievements, or outcomes.`;
  const res = await chatWithGemma([{ role: 'user', content: prompt }], context);
  if (res.source === 'offline-demo') {
    throw new Error('Start Ollama and install a Gemma 4 model to use AI entry polishing.');
  }

  const polished = res.reply.match(/(?:^|\n)Description:\s*(.+?)(?=\nOutcome:|$)/is)?.[1]?.trim();
  const suggestedOutcome = res.reply.match(/(?:^|\n)Outcome:\s*(.+)/is)?.[1]?.trim();
  if (!polished || !suggestedOutcome) {
    throw new Error('Gemma returned an unexpected format. Please try again.');
  }

  return {
    polished,
    suggestedOutcome,
    source: res.source,
  };
}

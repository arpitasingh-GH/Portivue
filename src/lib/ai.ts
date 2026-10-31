const OLLAMA_BASE = '/api';

async function callOllama(prompt: string, model = 'gemma4:e2b'): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt })
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${txt}`);
  }
  const data = await response.json();
  return data.response?.trim() ?? '';
}

export async function generateBio(current: string): Promise<string> {
  const prompt = `Write a concise professional bio for a software developer based on this input:\n${current}`;
  return callOllama(prompt);
}

export async function suggestSkills(current: string): Promise<string> {
  const prompt = `Suggest up to 10 relevant technical skills based on this description:\n${current}`;
  return callOllama(prompt);
}

export async function generateProjectDescription(current: string): Promise<string> {
  const prompt = `Create a project description (max 300 characters) from this bullet list:\n${current}`;
  return callOllama(prompt);
}

export async function correctGrammar(current: string): Promise<string> {
  const prompt = `Correct the grammar and improve phrasing of the following text:\n${current}`;
  return callOllama(prompt);
}

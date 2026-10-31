# Portivue

Portivue is a student portfolio prototype built with React, TypeScript, and Vite. It supports local portfolio accounts and entries, a public-preview mode, and an optional Google Gemma 4 assistant.

## Use real Gemma 4 locally

Portivue does not bundle an AI model. The assistant sends prompts to a locally running Ollama server; Ollama runs the selected Gemma model on your computer.

1. Install [Ollama](https://ollama.com/download).
2. In PowerShell, download the small Gemma 4 E2B model:

   ```powershell
   ollama pull gemma4:e2b
   ```

   Ollama normally starts its local API automatically. If it is not running, start it with `ollama serve`.
3. Install project dependencies and start Portivue:

   ```powershell
   npm install
   npm run dev
   ```

4. Open the assistant's settings and set:
   - Model: `Gemma 4 E2B`
   - Ollama endpoint: `http://localhost:11434/v1`
5. Send a prompt. A successful response is labeled with the Gemma model; if Ollama is unavailable or the model is missing, Portivue displays the connection error instead of presenting a demo response as AI.

To configure the endpoint through Vite instead, copy `.env.example` to `.env`, set `VITE_GEMMA_ENDPOINT_URL=http://localhost:11434/v1` and `VITE_GEMMA_MODEL=gemma4:e2b`, then restart the dev server. The assistant settings saved in your browser take precedence over environment defaults; if you previously used Portivue, set the endpoint in the settings panel.

Other Ollama Gemma 4 model tags available in the selector are `gemma4:e4b`, `gemma4:12b`, `gemma4:26b`, and `gemma4:31b`. Larger models require more hardware and disk space.

## Offline demo mode

When no endpoint is configured, chat responses come from fixed, rule-based examples. They are labeled **Offline demo · not AI** and do not use Gemma. AI-powered bio and entry polishing requires a working Ollama endpoint.

## Project notes

- Portfolio accounts and data are stored in the browser for this prototype. The SQL files under `supabase/migrations/` do not by themselves connect the running app to a production backend.
- A custom endpoint's optional API key is stored in browser local storage. Do not enter production credentials in this client-side prototype; use a server-side proxy for authenticated cloud services.
- Certificate links in the sample portfolio are course information, not proof that a credential was earned.

## Run and build

```powershell
npm install
npm run dev
npm run build
```

The development server prints its local URL (usually `http://localhost:5173`).

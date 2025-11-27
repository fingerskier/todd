# todd
A desktop digital twin.
Tesseract-Optimized Dimensional Daemon


## Special Settings
Use `electron-store` to persist application settings.
* App window setup
  * On startup these are checked against the current display to avoid off-screen windows
  * `windowX` - The X position of the window
  * `windowY` - The Y position of the window
  * `windowWidth` - The width of the window
  * `windowHeight` - The height of the window
* Database setup
  * `dbHost` - The hostname of the Postgres database
  * `dbPort` - The port of the Postgres database
  * `dbName` - The name of the Postgres database
  * `dbUser` - The username for the Postgres database
  * `dbPassword` - The password for the Postgres database


## Architecture
* Electron + React + Vite
  * IPC between main and renderer
  * Menu system (top bar and context menus)
* Postgres DB backend
* Google Gemini local models for LLM and embedding

## Local Gemini / Gemma models
The app expects local-only model endpoints so that nothing leaves the device. The included service modules in `src/services/models` target [Ollama](https://ollama.com/) for both generation ("Gemini" via the Gemma 2 instruction models) and embeddings.

### Install Ollama and pull the models
1. Install Ollama for your platform from https://ollama.com/download and ensure the daemon is running (defaults to `http://127.0.0.1:11434`).
2. Pull the current Google open-weight releases:
   * `ollama pull gemma2:9b-instruct` – used for LLM-style generation.
   * `ollama pull gemma2:2b-instruct` – lightweight option used for embeddings by default.

> You can override the defaults with environment variables:
> * `TODD_GEMINI_MODEL` changes the instruction-tuned model used for text generation.
> * `TODD_GEMMA_EMBED_MODEL` changes the model used for embeddings.
> * `OLLAMA_HOST` points the services to a non-standard Ollama URL (e.g., a different port or remote host).

### I/O modules
* `src/services/models/ollamaClient.js` – minimal HTTP client for Ollama's `/api/generate` and `/api/embeddings` endpoints.
* `src/services/models/geminiLocal.js` – convenience wrapper for running prompts against the local Gemini/Gemma LLM.
* `src/services/models/gemmaEmbeddings.js` – helper for producing embeddings locally.


## Features Under Construction
* Postegres DB connection
* Settings page
  * Database connection settings
  * Local model settings
* Dashboard
  * Status of local models
  * Database stats
  * Recent activity/logs
* Database migration management page
* Initial data
  * timestamped logs
  * key/value states
  * graph (nodes & edges) data
  * vector store {type:log|kv|graph, id, vector(384)}
* Google gemini-node and gemmaEmbedder **local** models
* Base UX
  * User enters some text which gets captured in the logs
  * Local AI infers possible KV or Graph entries
  * If the user approves then those records are added
  * Any added Log, KV or Graph records get vectorized, via the local Gemma embedder, and stored in PG


## Features Under Consideration
* System Tray integration
* Voice input
* Custom themes that change based on context
* Adaptive UI based on context (AI generated layouts?)


## Proposed Features


## Claude Stuff
* Goto `\Users\YOURUSERNAME\.claude-worktrees\todd\WORKTREENAME`
* Goto your working directory

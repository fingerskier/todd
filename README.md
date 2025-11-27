# todd
A desktop digital twin.
Tesseract-Optimized Dimensional Daemon


## Special Settings
Settings that are prefixed `todd:` are related to the app itself
* App window setup
  * On startup these are checked against the current display to avoid off-screen windows
  * `todd:windowX` - The X position of the window
  * `todd:windowY` - The Y position of the window
  * `todd:windowWidth` - The width of the window
  * `todd:windowHeight` - The height of the window
* 


## Features Under Construction
* Postegres DB connection
* Database migration manager
* Initial data
  * timestamped logs
  * key/value states
  * graph (node-edge) data
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

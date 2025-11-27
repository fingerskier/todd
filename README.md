# todd
A desktop digital twin.


## Special Settings
Settings that are prefixed `todd:` are related to the app itself
* `todd:windowX`


## Features Under Constructions
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


## Proposed Features

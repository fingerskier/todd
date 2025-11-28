import { withClient } from './database.js';

export const migrations = [
  {
    id: 1,
    name: 'initial-schema',
    description: 'Create migrations, logs, kv, graph, and vector tables',
    up: async (client) => {
      let res0 = await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      console.log('Created migrations table', res0);

      let res1 = await client.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          message TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      console.log('Created logs table',  res1);


      let res2 = await client.query(`
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value JSONB,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      console.log('Created kv table', res2);

      let res3 = await client.query(`
        CREATE TABLE IF NOT EXISTS nodes (
          id SERIAL PRIMARY KEY,  -- Unique identifier for each node
          label TEXT,             -- Optional: A label or type for the node
          properties JSONB        -- Optional: Flexible storage for node properties (e.g., name, age)
        );
      `);
      console.log('Created nodes table', res3);

      let res4 = await client.query(`
        CREATE TABLE IF NOT EXISTS edges (
          id SERIAL PRIMARY KEY,  -- Unique identifier for each edge
          source_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,  -- Reference to the source node
          target_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,  -- Reference to the target node
          label TEXT,             -- Optional: A label or type for the edge (e.g., 'friend', 'parent')
          properties JSONB,       -- Optional: Flexible storage for edge properties (e.g., weight, since)
          directed BOOLEAN DEFAULT TRUE  -- Optional: Indicates if the edge is directed (true) or undirected (false)
        );
      `);
      console.log('Created edges table', res4);

      // let res5 = await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      // console.log('Ensured vector extension', res5);

      const vectorTypeRes = await client.query(`
        SELECT typname, nspname
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE typname = 'vector'
      `);
      console.log('Vector Type Info:', vectorTypeRes.rows);  // Should show [{ typname: 'vector', nspname: 'public' }]

      let res6 = await client.query(`
        CREATE TABLE IF NOT EXISTS vectors (
          id SERIAL PRIMARY KEY,
          item_type TEXT NOT NULL,
          item_id INTEGER NOT NULL,
          vector VECTOR(384) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (item_type, item_id)
        );
      `);
      console.log('Created vectors table', res6);
    },
  },
];

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function getMigrationStatus() {
  return withClient(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await client.query('SELECT id, name, applied_at FROM migrations ORDER BY id ASC');
    const appliedMap = new Map(applied.rows.map((row) => [row.id, row]));

    return migrations.map((migration) => ({
      id: migration.id,
      name: migration.name,
      description: migration.description,
      appliedAt: appliedMap.get(migration.id)?.applied_at ?? null,
    }));
  });
}

export async function applyPendingMigrations() {
  return withClient(async (client) => {
    await ensureMigrationsTable(client);

    const applied = await client.query('SELECT id FROM migrations');
    const appliedIds = new Set(applied.rows.map((row) => row.id));

    const pending = migrations.filter((migration) => !appliedIds.has(migration.id));
    if (pending.length === 0) {
      return { applied: [], message: 'No pending migrations' };
    }

    const appliedMigrations = [];

    await client.query('BEGIN');
    try {
      for (const migration of pending) {
        await migration.up(client);
        await client.query('INSERT INTO migrations (id, name) VALUES ($1, $2)', [migration.id, migration.name]);
        appliedMigrations.push(migration.name);
      }
      await client.query('COMMIT');
      return { applied: appliedMigrations, message: 'Migrations applied successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

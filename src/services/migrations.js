import { withClient } from './database.js';

export const migrations = [
  {
    id: 1,
    name: 'initial-schema',
    description: 'Create migrations, logs, kv, graph, and vector tables',
    up: async (client) => {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value JSONB,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS graph (
          id SERIAL PRIMARY KEY,
          source TEXT NOT NULL,
          target TEXT NOT NULL,
          weight NUMERIC,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS vectors (
          id SERIAL PRIMARY KEY,
          item_type TEXT NOT NULL,
          item_id INTEGER NOT NULL,
          vector VECTOR(384) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (item_type, item_id)
        );
      `);
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

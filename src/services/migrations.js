import { withClient } from './database.js';

export const migrations = [
  {
    id: 1,
    name: 'initial-schema',
    description: 'Create migrations, logs, kv, graph, and vector tables',
    up: async (client) => {
      await client.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.exec(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          metadata TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.exec(`
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.exec(`
        CREATE TABLE IF NOT EXISTS nodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          label TEXT,
          properties TEXT
        );
      `);

      await client.exec(`
        CREATE TABLE IF NOT EXISTS edges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
          target_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
          label TEXT,
          properties TEXT,
          directed BOOLEAN DEFAULT TRUE
        );
      `);

      await client.exec(`
        CREATE TABLE IF NOT EXISTS vectors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_type TEXT NOT NULL,
          item_id INTEGER NOT NULL,
          vector TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (item_type, item_id)
        );
      `);
    },
  },
];

async function ensureMigrationsTable(client) {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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

    await client.exec('BEGIN');
    try {
      for (const migration of pending) {
        await migration.up(client);
        await client.query('INSERT INTO migrations (id, name) VALUES (?, ?)', [migration.id, migration.name]);
        appliedMigrations.push(migration.name);
      }
      await client.exec('COMMIT');
      return { applied: appliedMigrations, message: 'Migrations applied successfully' };
    } catch (error) {
      await client.exec('ROLLBACK');
      throw error;
    }
  });
}

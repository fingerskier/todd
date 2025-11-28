import { app } from 'electron';
import path from 'node:path';
import { connect as connectDatabase } from '@tursodatabase/database';
import { handleVectorSideEffects } from './vectors.js';

let db = null;
let currentPath = null;

function ensureConnected() {
  if (!db) {
    throw new Error('Database not connected');
  }
}

function resolveDatabasePath(config) {
  if (config?.path) {
    return config.path;
  }

  const base = app.getPath('userData');
  return path.join(base, 'todd.db');
}

function buildConnectionTarget(config = {}, resolvedPath) {
  if (config.url && config.authToken) {
    return { path: resolvedPath, url: config.url, authToken: config.authToken, sync: 'full' };
  }

  return resolvedPath;
}

function createClientWrapper() {
  return {
    exec: (sql) => db.exec(sql),
    query: async (sql, params = []) => {
      const statement = db.prepare(sql);
      const hasReturning = /\bRETURNING\b/i.test(sql);
      const isSelect = /^\s*SELECT/i.test(sql);

      try {
        if (isSelect || hasReturning) {
          const rows = await statement.all(...params);
          return { rows };
        }

        const result = await statement.run(...params);
        return { rows: [], changes: result.changes, lastInsertRowid: result.lastInsertRowid };
      } finally {
        statement.close();
      }
    },
  };
}

export async function connect(config = {}) {
  try {
    if (db) {
      await db.close();
    }

    currentPath = resolveDatabasePath(config);
    const connectionTarget = buildConnectionTarget(config, currentPath);
    db = await connectDatabase(connectionTarget);
    await db.exec('PRAGMA foreign_keys = ON;');

    return { success: true, message: 'Connected to embedded database', path: currentPath };
  } catch (error) {
    db = null;
    currentPath = null;
    return { success: false, message: error.message };
  }
}

export async function disconnect() {
  try {
    if (db) {
      await db.close();
      db = null;
      currentPath = null;
    }
    return { success: true, message: 'Disconnected successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function query(text, params = []) {
  try {
    ensureConnected();
    const client = createClientWrapper();
    const isSelect = /^\s*SELECT/i.test(text) || /\bRETURNING\b/i.test(text);
    const result = await client.query(text, params);
    const response = isSelect
      ? { success: true, data: result.rows }
      : { success: true, data: result };

    if (!isSelect) {
      try {
        await handleVectorSideEffects(client, text, params, result);
        response.vectorsUpdated = true;
      } catch (vectorError) {
        console.warn('Vector side effects failed:', vectorError);
        response.vectorsUpdated = false;
        response.vectorWarning = vectorError.message;
      }
    }

    return response;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function withClient(callback) {
  ensureConnected();
  const client = createClientWrapper();
  return callback(client);
}

export async function testConnection(config = {}) {
  try {
    const testPath = resolveDatabasePath(config);
    const connectionTarget = buildConnectionTarget(config, testPath);
    const testDb = await connectDatabase(connectionTarget);
    await testDb.exec('PRAGMA foreign_keys = ON;');
    await testDb.close();

    return { success: true, message: 'Connection test successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function isConnected() {
  return db !== null;
}

export function getCurrentPath() {
  return currentPath;
}

import { Pool } from 'pg';

let pool = null;

export async function connect(config) {
  try {
    if (pool) {
      await pool.end();
    }

    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });

    // Test the connection
    const client = await pool.connect();
    client.release();

    return { success: true, message: 'Connected successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function disconnect() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
    }
    return { success: true, message: 'Disconnected successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function query(text, params) {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    const result = await pool.query(text, params);
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function testConnection(config) {
  try {
    const testPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });

    const client = await testPool.connect();
    client.release();
    await testPool.end();

    return { success: true, message: 'Connection test successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function isConnected() {
  return pool !== null;
}

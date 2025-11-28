import { embedText } from './models/gemmaEmbeddings.js';

const VECTOR_UPSERT_SQL = `
  INSERT INTO vectors (item_type, item_id, vector)
  VALUES (?, ?, ?)
  ON CONFLICT(item_type, item_id) DO UPDATE SET
    vector = excluded.vector,
    created_at = CURRENT_TIMESTAMP;
`;

function stringifyStructured(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildLogContent({ message, metadata }) {
  return [message, stringifyStructured(metadata)].filter(Boolean).join('\n');
}

function buildNodeContent({ label, properties }) {
  return [label, stringifyStructured(properties)].filter(Boolean).join('\n');
}

function buildEdgeContent({ label, properties, sourceId, targetId }) {
  const endpoints = [sourceId, targetId].filter((id) => id !== undefined && id !== null);
  const endpointSummary = endpoints.length ? `edge:${endpoints.join('->')}` : '';
  return [label, endpointSummary, stringifyStructured(properties)].filter(Boolean).join('\n');
}

function buildKvContent({ key, value }) {
  return [key, stringifyStructured(value)].filter(Boolean).join('\n');
}

function buildContent(itemType, payload) {
  switch (itemType) {
    case 'log':
      return buildLogContent(payload);
    case 'node':
      return buildNodeContent(payload);
    case 'edge':
      return buildEdgeContent(payload);
    case 'kv':
      return buildKvContent(payload);
    default:
      return '';
  }
}

async function upsertVector(client, itemType, itemId, payload) {
  if (itemId === undefined || itemId === null) {
    return;
  }

  const content = buildContent(itemType, payload);
  if (!content.trim()) {
    return;
  }

  const { embedding } = await embedText(content);
  const vectorPayload = JSON.stringify(embedding);

  await client.query(VECTOR_UPSERT_SQL, [itemType, itemId, vectorPayload]);
}

export async function handleVectorSideEffects(client, sql, params = [], result = {}) {
  const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  if (normalized.startsWith('insert into logs')) {
    await upsertVector(client, 'log', result.lastInsertRowid, {
      message: params?.[1] ?? params?.[0],
      metadata: params?.[2] ?? params?.[1],
    });
    return;
  }

  if (normalized.startsWith('update logs')) {
    await upsertVector(client, 'log', params?.[2], {
      message: params?.[0],
      metadata: params?.[1],
    });
    return;
  }

  if (normalized.startsWith('insert into nodes')) {
    await upsertVector(client, 'node', result.lastInsertRowid, {
      label: params?.[0],
      properties: params?.[1],
    });
    return;
  }

  if (normalized.startsWith('update nodes')) {
    await upsertVector(client, 'node', params?.[2], {
      label: params?.[0],
      properties: params?.[1],
    });
    return;
  }

  if (normalized.startsWith('insert into edges')) {
    await upsertVector(client, 'edge', result.lastInsertRowid, {
      sourceId: params?.[0],
      targetId: params?.[1],
      label: params?.[2],
      properties: params?.[3],
    });
    return;
  }

  if (normalized.startsWith('update edges')) {
    await upsertVector(client, 'edge', params?.[5], {
      sourceId: params?.[0],
      targetId: params?.[1],
      label: params?.[2],
      properties: params?.[3],
    });
    return;
  }

  if (normalized.startsWith('insert into kv')) {
    await upsertVector(client, 'kv', params?.[0], {
      key: params?.[0],
      value: params?.[1],
    });
    return;
  }

  if (normalized.startsWith('update kv')) {
    await upsertVector(client, 'kv', params?.[1], {
      key: params?.[1],
      value: params?.[0],
    });
  }
}

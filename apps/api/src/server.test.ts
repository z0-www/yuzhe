import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.js';

test('GET /health reports API readiness and DSH configuration state', async () => {
  const server = createApiServer().listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', service: 'yuzhe-api', dsh: 'not-configured' });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('unknown API routes return a JSON 404', async () => {
  const server = createApiServer().listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/missing`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not_found' });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

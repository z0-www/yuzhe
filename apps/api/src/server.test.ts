import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from './server.js';
import type { ChatRequest, ChatResponse } from '@yuzhe/contracts';
import type { DshAdapter } from '@yuzhe/dsh-adapter';

const request: ChatRequest = { content: 'hello', mode: 'chat', answerStyle: 'quick' };
const response: ChatResponse = {
  demo: false,
  provider: 'dsh',
  session: { id: 'session-1', title: 'hello', mode: 'chat', answerStyle: 'quick', messages: [], createdAt: new Date(0).toISOString() },
  message: { id: 'message-1', role: 'assistant', content: 'YUZHE_DSH_OK', createdAt: new Date(0).toISOString() },
};

async function listen(server: ReturnType<typeof createApiServer>): Promise<{ server: ReturnType<typeof createApiServer>; url: string }> {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return { server, url: `http://127.0.0.1:${address.port}` };
}

async function close(server: ReturnType<typeof createApiServer>): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

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

test('POST /chat forwards a request to the configured DSH adapter', async () => {
  let received: ChatRequest | undefined;
  let closed = false;
  const adapter: DshAdapter = {
    isConfigured: true,
    async chat(value) { received = value; return response; },
    async close() { closed = true; },
  };
  const listening = await listen(createApiServer({ adapter }));
  try {
    const result = await fetch(`${listening.url}/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) });
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), response);
    assert.deepEqual(received, request);
    const health = await fetch(`${listening.url}/health`);
    assert.deepEqual(await health.json(), { status: 'ok', service: 'yuzhe-api', dsh: 'configured' });
  } finally {
    await close(listening.server);
  }
  assert.equal(closed, true);
});

test('POST /chat returns a clear unavailable response when DSH is not configured', async () => {
  const listening = await listen(createApiServer());
  try {
    const result = await fetch(`${listening.url}/v1/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) });
    assert.equal(result.status, 503);
    const body = await result.json();
    assert.equal(body.error, 'dsh_unavailable');
    assert.match(body.message, /unavailable/);
    assert.equal(body.demo, undefined);
  } finally {
    await close(listening.server);
  }
});

test('POST /chat rejects empty content before calling DSH', async () => {
  let called = false;
  const adapter: DshAdapter = { isConfigured: true, async chat() { called = true; return response; }, async close() {} };
  const listening = await listen(createApiServer({ adapter }));
  try {
    const result = await fetch(`${listening.url}/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...request, content: '  ' }) });
    assert.equal(result.status, 400);
    assert.equal((await result.json()).error, 'invalid_request');
    assert.equal(called, false);
  } finally {
    await close(listening.server);
  }
});

test('POST /chat returns timeout without exposing upstream details', async () => {
  const adapter: DshAdapter = { isConfigured: true, async chat() { return new Promise<ChatResponse>(() => {}); }, async close() {} };
  const listening = await listen(createApiServer({ adapter, chatTimeoutMs: 10 }));
  try {
    const result = await fetch(`${listening.url}/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) });
    assert.equal(result.status, 504);
    assert.deepEqual((await result.json()).error, 'timeout');
  } finally {
    await close(listening.server);
  }
});

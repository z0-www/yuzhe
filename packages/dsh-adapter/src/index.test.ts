import test from 'node:test';
import assert from 'node:assert/strict';
import { UnconfiguredDshAdapter } from './index.js';
import type { ChatRequest } from '@yuzhe/contracts';

test('unconfigured DSH fails clearly instead of fabricating a response', async () => {
  const request: ChatRequest = { content: '你好', mode: 'chat', answerStyle: 'quick' };
  await assert.rejects(() => new UnconfiguredDshAdapter().chat(request), /DSH integration is not configured/);
});

test('unconfigured DSH close is safe and idempotent', async () => {
  const adapter = new UnconfiguredDshAdapter();
  await adapter.close();
  await adapter.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { answerStyles, canSend, demoReply, modes, nextModeIndex, wheelItemsFor } from './domain';

test('defines exactly five task modes and preserves their ids', () => {
  assert.equal(modes.length, 5);
  assert.deepEqual(modes.map((mode) => mode.id), ['chat', 'vision', 'research', 'writing', 'actions']);
});

test('wraps mode switching in both directions', () => {
  assert.equal(nextModeIndex(0, -1), 4);
  assert.equal(nextModeIndex(4, 1), 0);
  assert.equal(wheelItemsFor(0).find((item) => item.offset === 0)?.id, 'chat');
  assert.equal(wheelItemsFor(4).find((item) => item.offset === 0)?.id, 'actions');
});

test('tracks quick and deep answer styles as distinct choices', () => {
  assert.deepEqual(answerStyles.map((style) => style.id), ['quick', 'deep']);
  assert.equal(answerStyles[0].label, '快速回答');
  assert.equal(answerStyles[1].label, '深度思考');
});

test('rejects empty input and accepts non-empty input', () => {
  assert.equal(canSend(''), false);
  assert.equal(canSend('   \n'), false);
  assert.equal(canSend('你好'), true);
});

test('marks demo replies explicitly and never presents them as real AI output', () => {
  const reply = demoReply(modes[0]);
  assert.equal(reply.demo, true);
  assert.match(reply.content, /演示回复/);
  assert.match(reply.content, /尚未接入/);
});

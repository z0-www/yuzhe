#!/usr/bin/env node

const EXPECTED_VERSION = '0.2.1-rc.2';
const expectedPackages = {
  '@deepseek-ai/dsh-sdk-client': EXPECTED_VERSION,
  '@deepseek-ai/dsh': EXPECTED_VERSION,
  '@deepseek-ai/dsh-llm': EXPECTED_VERSION,
  '@deepseek-ai/dsh-session': EXPECTED_VERSION,
  '@deepseek-ai/dsh-sdk-protocol': EXPECTED_VERSION,
  '@deepseek-ai/cordis': '4.0.5',
};
const [major, minor] = process.versions.node.split('.').map(Number);
if (!(major >= 24 || (major === 22 && minor >= 19))) {
  console.error(`[blocked] DSH ${EXPECTED_VERSION} requires Node ^22.19.0 or >=24.0.0; found ${process.versions.node}`);
  process.exit(2);
}
const packageVersions = async (name) => {
  try {
    const module = await import(`${name}/package.json`, { with: { type: 'json' } });
    return module.default?.version;
  } catch {
    return undefined;
  }
};

const required = Object.keys(expectedPackages);
const versions = Object.fromEntries(await Promise.all(required.map(async (name) => [name, await packageVersions(name)])));
const missing = required.filter((name) => versions[name] === undefined);
const mismatched = required.filter((name) => versions[name] !== undefined && versions[name] !== expectedPackages[name]);
const provider = process.env.YUZHE_DSH_PROVIDER;
const model = process.env.YUZHE_DSH_MODEL;
if (missing.length || mismatched.length || !provider || !model) {
  if (missing.length) console.error(`[blocked] missing exact DSH packages: ${missing.join(', ')}`);
  if (mismatched.length) console.error(`[blocked] DSH package versions mismatch: ${mismatched.map((name) => `${name}=${versions[name]} (expected ${expectedPackages[name]})`).join(', ')}`);
  if (!provider) console.error('[blocked] set YUZHE_DSH_PROVIDER to the provider configured in DSH');
  if (!model) console.error('[blocked] set YUZHE_DSH_MODEL to the model configured in DSH');
  console.error('[blocked] configure credentials through the cloud secret store or DSH_HOME; secret values are never printed');
  process.exit(2);
}

const { DeepSeekHarness } = await import('@deepseek-ai/dsh-sdk-client');
const timeout = Number(process.env.YUZHE_DSH_TIMEOUT_MS ?? 60_000);
if (!Number.isSafeInteger(timeout) || timeout <= 0) {
  console.error('[blocked] YUZHE_DSH_TIMEOUT_MS must be a positive integer');
  process.exit(2);
}
const options = {
  profile: process.env.YUZHE_DSH_PROFILE ?? 'sdk',
  provider,
  model,
  initializeTimeoutMs: timeout,
  requestTimeoutMs: timeout,
  ...(process.env.YUZHE_DSH_HOME ? { dshHome: process.env.YUZHE_DSH_HOME } : {}),
};
const harness = new DeepSeekHarness(options);
const assertRealResponse = (result, expected, label) => {
  const turnEnd = result.events.find((event) => event.type === 'turn/end');
  const reason = turnEnd?.data?.reason;
  const runtimeCode = reason && typeof reason === 'object' && reason.error && typeof reason.error === 'object' ? reason.error.code : undefined;
  if (runtimeCode) throw new Error(`${label} turn failed with DSH error code ${runtimeCode}`);
  if (result.finalResponse.trim() !== expected) throw new Error(`${label} real DSH response did not equal ${expected}`);
};
try {
  const first = await harness.run('Reply with exactly YUZHE_DSH_OK and nothing else.');
  assertRealResponse(first, 'YUZHE_DSH_OK', 'first');
  const second = await harness.run('Reply with exactly YUZHE_DSH_OK_2 and nothing else.', { sessionId: first.sessionId });
  assertRealResponse(second, 'YUZHE_DSH_OK_2', 'resumed');
  console.log(`PASS real DSH smoke: session ${first.sessionId} completed two prompts`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAIL real DSH smoke: ${message}`);
  process.exitCode = 1;
} finally {
  try {
    await harness.close();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL real DSH cleanup: ${message}`);
    process.exitCode = 1;
  }
}

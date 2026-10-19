import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { AnswerStyle, Attachment, ChatErrorCode, ChatRequest, Mode } from '@yuzhe/contracts';
import { DshAdapterError, UnconfiguredDshAdapter, type DshAdapter } from '@yuzhe/dsh-adapter';

const modes = new Set<Mode>(['chat', 'vision', 'research', 'writing', 'actions']);
const answerStyles = new Set<AnswerStyle>(['quick', 'deep']);
const attachmentStatuses = new Set<Attachment['status']>(['pending', 'ready', 'unsupported']);
const DEFAULT_MAX_BODY_BYTES = 512 * 1024;
const DEFAULT_CHAT_TIMEOUT_MS = 60_000;

export interface ApiServerOptions {
  adapter?: DshAdapter;
  maxBodyBytes?: number;
  chatTimeoutMs?: number;
}

class RequestBodyError extends Error {
  readonly code: 'invalid_json' | 'body_too_large';

  constructor(code: 'invalid_json' | 'body_too_large', message: string) {
    super(message);
    this.name = 'RequestBodyError';
    this.code = code;
  }
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new Error(`${name} must be a string of at most ${maxLength} characters`);
  }
  return value;
}

function parseChatRequest(value: unknown): ChatRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('request body must be a JSON object');
  }
  const body = value as Record<string, unknown>;
  const content = parseString(body.content, 'content', 32_000).trim();
  if (!content) throw new Error('content must not be empty');
  if (typeof body.mode !== 'string' || !modes.has(body.mode as Mode)) {
    throw new Error('mode is invalid');
  }
  if (typeof body.answerStyle !== 'string' || !answerStyles.has(body.answerStyle as AnswerStyle)) {
    throw new Error('answerStyle is invalid');
  }

  let sessionId: string | undefined;
  if (body.sessionId !== undefined) sessionId = parseString(body.sessionId, 'sessionId', 200);

  let attachments: Attachment[] | undefined;
  if (body.attachments !== undefined) {
    if (!Array.isArray(body.attachments) || body.attachments.length > 8) {
      throw new Error('attachments must be an array with at most 8 items');
    }
    attachments = body.attachments.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`attachments[${index}] is invalid`);
      const attachment = item as Record<string, unknown>;
      const id = parseString(attachment.id, `attachments[${index}].id`, 200);
      const name = parseString(attachment.name, `attachments[${index}].name`, 255);
      const mimeType = parseString(attachment.mimeType, `attachments[${index}].mimeType`, 200);
      if (typeof attachment.size !== 'number' || !Number.isSafeInteger(attachment.size) || attachment.size < 0) {
        throw new Error(`attachments[${index}].size is invalid`);
      }
      if (typeof attachment.status !== 'string' || !attachmentStatuses.has(attachment.status as Attachment['status'])) {
        throw new Error(`attachments[${index}].status is invalid`);
      }
      return { id, name, mimeType, size: attachment.size, status: attachment.status as Attachment['status'] };
    });
  }

  const request: ChatRequest = { content, mode: body.mode as Mode, answerStyle: body.answerStyle as AnswerStyle };
  if (sessionId !== undefined) request.sessionId = sessionId;
  if (attachments !== undefined) request.attachments = attachments;
  return request;
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on('data', (chunk: Buffer | string) => {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += data.byteLength;
      if (size > maxBytes) {
        req.resume();
        fail(new RequestBodyError('body_too_large', 'request body exceeds the configured limit'));
        return;
      }
      chunks.push(data);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolveBody(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('aborted', () => fail(new Error('request aborted')));
    req.on('error', fail);
  });
}

function mapDshError(error: unknown): { status: number; code: ChatErrorCode; message: string } {
  if (error instanceof DshAdapterError) {
    if (error.code === 'not_configured' || error.code === 'startup_failed' || error.code === 'initialization_timeout' || error.code === 'closed') {
      return { status: 503, code: 'dsh_unavailable', message: 'DSH service is unavailable' };
    }
    if (error.code === 'request_timeout') return { status: 504, code: 'timeout', message: 'DSH request timed out' };
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return { status: 504, code: 'timeout', message: 'DSH request timed out' };
  }
  return { status: 502, code: 'upstream_error', message: 'DSH request failed' };
}

async function chatWithTimeout(adapter: DshAdapter, request: ChatRequest, req: IncomingMessage, timeoutMs: number) {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  let abortRequest: (() => void) | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DshAdapterError('request_timeout', 'DSH request timed out'));
    }, timeoutMs);
  });
  const disconnected = new Promise<never>((_, reject) => {
    abortRequest = () => {
      controller.abort();
      reject(new DshAdapterError('request_timeout', 'client disconnected while waiting for DSH'));
    };
    req.once('aborted', abortRequest);
  });
  try {
    return await Promise.race([adapter.chat(request, controller.signal), timeout, disconnected]);
  } finally {
    if (timer) clearTimeout(timer);
    if (abortRequest) req.off('aborted', abortRequest);
  }
}

export function createApiServer(options: ApiServerOptions = {}) {
  const adapter = options.adapter ?? new UnconfiguredDshAdapter();
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const chatTimeoutMs = options.chatTimeoutMs ?? DEFAULT_CHAT_TIMEOUT_MS;
  const server = createHttpServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = req.url?.split('?')[0];
    if (pathname === '/health' && req.method === 'GET') {
      json(res, 200, { status: 'ok', service: 'yuzhe-api', dsh: adapter.isConfigured === true ? 'configured' : 'not-configured' });
      return;
    }
    if ((pathname === '/chat' || pathname === '/v1/chat') && req.method === 'POST') {
      void (async () => {
        const requestId = randomUUID();
        try {
          const rawBody = await readBody(req, maxBodyBytes);
          let parsed: unknown;
          try {
            parsed = JSON.parse(rawBody);
          } catch {
            throw new RequestBodyError('invalid_json', 'request body must be valid JSON');
          }
          let chatRequest: ChatRequest;
          try {
            chatRequest = parseChatRequest(parsed);
          } catch (error) {
            throw new RequestValidationError(error instanceof Error ? error.message : 'request body is invalid');
          }
          const response = await chatWithTimeout(adapter, chatRequest, req, chatTimeoutMs);
          json(res, 200, response);
        } catch (error) {
          if (res.writableEnded) return;
          if (error instanceof RequestBodyError) {
            json(res, error.code === 'body_too_large' ? 413 : 400, { error: 'invalid_request', message: error.message, requestId });
            return;
          }
          if (error instanceof RequestValidationError) {
            json(res, 400, { error: 'invalid_request', message: error.message, requestId });
            return;
          }
          const mapped = mapDshError(error);
          json(res, mapped.status, { error: mapped.code, message: mapped.message, requestId });
        }
      })();
      return;
    }
    json(res, 404, { error: 'not_found' });
  });
  server.once('close', () => { void adapter.close(); });
  return server;
}

export function startServer(port = Number(process.env.PORT ?? 8787)) {
  const server = createApiServer();
  return server.listen(port, () => console.log(`Yuzhe API listening on :${port}`));
}

const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  if (process.argv.includes('--self-test')) {
    const server = createApiServer().listen(0, () => {
      console.log('api self-test: server module loaded');
      server.close();
    });
  } else {
    startServer();
  }
}

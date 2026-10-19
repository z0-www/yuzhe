import type { ChatRequest, ChatResponse } from '@yuzhe/contracts';

export type DshAdapterErrorCode = 'not_configured' | 'startup_failed' | 'initialization_timeout' | 'request_timeout' | 'request_failed' | 'closed';

/** Errors from the DSH boundary are intentionally typed so the API can map them
 * to stable public error responses without exposing SDK internals. */
export class DshAdapterError extends Error {
  readonly code: DshAdapterErrorCode;
  readonly cause?: unknown;

  constructor(code: DshAdapterErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'DshAdapterError';
    this.code = code;
    this.cause = options?.cause;
  }
}

export interface DshAdapter {
  /** False/omitted means this process cannot call a real DSH runtime. */
  readonly isConfigured?: boolean;
  chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>;
  close(): Promise<void>;
}
/** Boundary only. No official SDK call is enabled until version/protocol verification succeeds. */
export class UnconfiguredDshAdapter implements DshAdapter {
  readonly isConfigured = false;
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    throw new DshAdapterError('not_configured', 'DSH integration is not configured; real chat is unavailable');
  }
  async close(): Promise<void> { return; }
}

import type { ChatRequest, ChatResponse } from '@yuzhe/contracts';
export interface DshAdapter { chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>; close(): Promise<void>; }
/** Boundary only. No official SDK call is enabled until version/protocol verification succeeds. */
export class UnconfiguredDshAdapter implements DshAdapter {
  async chat(_request: ChatRequest): Promise<ChatResponse> { throw new Error('DSH integration is not configured; demo mode only'); }
  async close(): Promise<void> { return; }
}

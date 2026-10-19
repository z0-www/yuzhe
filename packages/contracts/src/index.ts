export type Mode = 'chat' | 'vision' | 'research' | 'writing' | 'actions';
export type AnswerStyle = 'quick' | 'deep';
export interface Attachment { id: string; name: string; mimeType: string; size: number; status: 'pending'|'ready'|'unsupported'; }
export interface Message { id: string; role: 'user'|'assistant'|'system'; content: string; createdAt: string; attachments?: Attachment[]; demo?: boolean; }
export interface Session { id: string; title: string; mode: Mode; answerStyle: AnswerStyle; messages: Message[]; createdAt: string; }
export interface Task { id: string; sessionId: string; type: Mode; status: 'queued'|'running'|'completed'|'failed'; }
export interface ChatRequest { sessionId?: string; content: string; mode: Mode; answerStyle: AnswerStyle; attachments?: Attachment[]; }
export interface ChatResponse { session: Session; message: Message; demo: true; }

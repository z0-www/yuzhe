export type Mode = {
  id: 'chat' | 'vision' | 'research' | 'writing' | 'actions';
  label: string;
  icon: string;
  prompt: string;
  description: string;
};

export const modes: readonly Mode[] = [
  { id: 'chat', label: '聊天', icon: '💬', prompt: '说句话，或者按住麦克风', description: '有什么说什么' },
  { id: 'vision', label: '读图与文件', icon: '📷', prompt: '把图片或文件放进来，我帮你看', description: '看图读纸，讲给你听' },
  { id: 'research', label: '查资料', icon: '⌕', prompt: '想知道什么？我帮你查', description: '把复杂问题查清楚' },
  { id: 'writing', label: '写作创作', icon: '✎', prompt: '告诉我想写什么', description: '一起把想法写出来' },
  { id: 'actions', label: '办事', icon: '✅', prompt: '需要我帮你办什么事？', description: '一步一步帮你办好' },
];

export type AnswerStyle = 'quick' | 'deep';
export const answerStyles: readonly { id: AnswerStyle; label: string; icon: string }[] = [
  { id: 'quick', label: '快速回答', icon: '⚡' },
  { id: 'deep', label: '深度思考', icon: '🧠' },
];
export const normalizeModeIndex = (index: number): number => ((index % modes.length) + modes.length) % modes.length;
export const nextModeIndex = (current: number, delta: number): number => normalizeModeIndex(current + delta);
export const wheelItemsFor = (current: number) => [-2, -1, 0, 1, 2].map((offset) => {
  const index = nextModeIndex(current, offset);
  return { ...modes[index], offset, index };
});
export const canSend = (value: string): boolean => value.trim().length > 0;
export const demoReply = (mode: Mode): { role: 'assistant'; content: string; demo: true } => ({
  role: 'assistant',
  content: `演示回复：已收到你的「${mode.label}」请求。真实云端 DSH 尚未接入。`,
  demo: true,
});

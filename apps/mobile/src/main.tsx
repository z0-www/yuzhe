import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Mode = { id: string; label: string; icon: string; prompt: string; description: string };
const modes: Mode[] = [
  { id: 'chat', label: '聊天', icon: '💬', prompt: '说句话，或者按住麦克风', description: '有什么说什么' },
  { id: 'vision', label: '读图与文件', icon: '📷', prompt: '把图片或文件放进来，我帮你看', description: '看图读纸，讲给你听' },
  { id: 'research', label: '查资料', icon: '⌕', prompt: '想知道什么？我帮你查', description: '把复杂问题查清楚' },
  { id: 'writing', label: '写作创作', icon: '✎', prompt: '告诉我想写什么', description: '一起把想法写出来' },
  { id: 'actions', label: '办事', icon: '✅', prompt: '需要我帮你办什么事？', description: '一步一步帮你办好' },
];

type Msg = { role: 'user' | 'assistant'; content: string; demo?: boolean };
function App() {
  const [modeIndex, setModeIndex] = useState(0);
  const [style, setStyle] = useState<'quick' | 'deep'>('quick');
  const [text, setText] = useState('');
  const [settings, setSettings] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const startX = useRef<number | null>(null);
  const mode = modes[modeIndex];
  const selectMode = (index: number) => setModeIndex((index + modes.length) % modes.length);
  const swipe = (delta: number) => selectMode(modeIndex + delta);
  const send = () => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: `演示回复：已收到你的「${mode.label}」请求。真实云端 DSH 尚未接入。`, demo: true }]);
    setText('');
  };
  const wheelItems = useMemo(() => [-2, -1, 0, 1, 2].map((offset) => {
    const index = (modeIndex + offset + modes.length) % modes.length;
    return { ...modes[index], offset, index };
  }), [modeIndex]);
  if (settings) return <main className="phone-shell"><header className="topbar"><button className="top-icon" onClick={() => setSettings(false)}>‹</button><span className="title">设置</span><span className="top-icon" /></header><section className="settings"><h1>设置</h1><p className="subtle">鱼者 · AI 助手</p><div className="setting-row">网络状态 <b className="online">● 在线</b></div><div className="setting-row">云端 DSH <span>未启用</span></div><div className="setting-row">主题 <span>跟随系统</span></div><div className="notice">当前为演示模式。语音、联网搜索、读图和办事能力将在后续版本接入。</div></section></main>;
  return <main className="phone-shell" onTouchStart={(e) => { startX.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (startX.current === null) return; const dx = e.changedTouches[0].clientX - startX.current; if (Math.abs(dx) > 35) swipe(dx < 0 ? 1 : -1); startX.current = null; }}>
    <header className="topbar"><button className="top-icon" onClick={() => setSettings(true)}>☰</button><span className="title">鱼者</span><button className="top-icon" onClick={() => setMessages([])}>⊕</button></header>
    <section className="main">
      <div className="hello"><div className="mark">···</div><div className="hello-text">现在用「<em>{mode.label}</em>」模式</div></div>
      {messages.length > 0 && <section className="chat">{messages.map((message, i) => <div className={`bubble ${message.role}`} key={i}>{message.content}{message.demo && <small>演示回复</small>}</div>)}</section>}
      {messages.length === 0 && <div className="spacer" />}
      <div className={`composer ${listening ? 'live' : ''}`}>
        {listening ? <div className="live-text">我在听<span className="cursor" /></div> : <div className="placeholder"><span className="clip">⌕</span>{mode.prompt}</div>}
        <div className="composer-row"><button className={`pill ${style === 'quick' ? 'chosen' : ''}`} onClick={() => setStyle('quick')}>⚡ 快速回答</button><button className={`pill ${style === 'deep' ? 'chosen' : ''}`} onClick={() => setStyle('deep')}>🧠 深度思考</button><button className="attach" onClick={() => alert('图片与文件入口：开发中')} aria-label="添加图片或文件">＋</button><button className={`send ${listening ? 'listening' : ''}`} onClick={() => { if (listening) setListening(false); else if (!text.trim()) setListening(true); else send(); }}>{listening ? '■' : text.trim() ? '↑' : '🎤'}</button></div>
        {!listening && <input aria-label="消息输入" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="输入文字..." />}
      </div>
      <div className="modeline"><span className="dot" />{mode.label} · <b>{mode.description}</b></div>
      <div className="wheel-title">左右滑动切换模式</div>
      <div className="wheel" aria-label="模式轮盘">{wheelItems.map((item) => <button key={`${item.id}-${item.offset}`} className={`wheel-item offset-${item.offset} ${item.offset === 0 ? 'on' : ''}`} onClick={() => selectMode(item.index)}><span>{item.icon}</span><small>{item.label}</small></button>)}</div>
      <p className="network">● 网络连接正常 · <span>云端 AI 未接入，当前为演示模式</span></p>
    </section>
    <div className="home-ind"><i /></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);

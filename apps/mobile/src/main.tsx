import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { answerStyles, canSend, demoReply, modes, nextModeIndex, wheelItemsFor } from './domain';
import type { Mode } from './domain';

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
  const selectMode = (index: number) => setModeIndex(nextModeIndex(index, 0));
  const swipe = (delta: number) => setModeIndex(nextModeIndex(modeIndex, delta));
  const send = () => {
    if (!canSend(text)) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }, demoReply(mode)]);
    setText('');
  };
  const wheelItems = useMemo(() => wheelItemsFor(modeIndex), [modeIndex]);
  if (settings) return <main className="phone-shell"><header className="topbar"><button className="top-icon" onClick={() => setSettings(false)}>‹</button><span className="title">设置</span><span className="top-icon" /></header><section className="settings"><h1>设置</h1><p className="subtle">鱼者 · AI 助手</p><div className="setting-row">网络状态 <b className="online">● 在线</b></div><div className="setting-row">云端 DSH <span>未启用</span></div><div className="setting-row">主题 <span>跟随系统</span></div><div className="notice">当前为演示模式。语音、联网搜索、读图和办事能力将在后续版本接入。</div></section></main>;
  return <main className="phone-shell">
    <header className="topbar"><button className="top-icon" onClick={() => setSettings(true)}>☰</button><span className="title">鱼者</span><button className="top-icon" onClick={() => setMessages([])}>⊕</button></header>
    <section className="main">
      <div className="hello"><div className="mark">···</div><div className="hello-text">现在用「<em>{mode.label}</em>」模式</div></div>
      {messages.length > 0 && <section className="chat">{messages.map((message, i) => <div className={`bubble ${message.role}`} key={i}>{message.content}{message.demo && <small>演示回复</small>}</div>)}</section>}
      {messages.length === 0 && <div className="spacer" />}
      <div className={`composer ${listening ? 'live' : ''}`}>
        {listening ? <div className="live-text">我在听<span className="cursor" /></div> : <div className="placeholder"><span className="clip">⌕</span>{mode.prompt}</div>}
        <div className="composer-row">{answerStyles.map((option) => <button key={option.id} className={`pill ${style === option.id ? 'chosen' : ''}`} onClick={() => setStyle(option.id)}>{option.icon} {option.label}</button>)}<button className="attach" onClick={() => alert('图片与文件入口：开发中')} aria-label="添加图片或文件">＋</button><button className={`send ${listening ? 'listening' : ''}`} onClick={() => { if (listening) setListening(false); else if (!text.trim()) setListening(true); else send(); }}>{listening ? '■' : text.trim() ? '↑' : '🎤'}</button></div>
        {!listening && <input aria-label="消息输入" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="输入文字..." />}
      </div>
      <div className="modeline"><span className="dot" />{mode.label} · <b>{mode.description}</b></div>
      <div className="wheel-title">左右滑动切换模式</div>
      <div className="wheel" aria-label="模式轮盘" onTouchStart={(e) => { startX.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (startX.current === null) return; const dx = e.changedTouches[0].clientX - startX.current; if (Math.abs(dx) > 35) swipe(dx < 0 ? 1 : -1); startX.current = null; }}>{wheelItems.map((item) => <button key={`${item.id}-${item.offset}`} className={`wheel-item offset-${item.offset} ${item.offset === 0 ? 'on' : ''}`} onClick={() => selectMode(item.index)}><span>{item.icon}</span><small>{item.label}</small></button>)}</div>
      <p className="network">● 网络连接正常 · <span>云端 AI 未接入，当前为演示模式</span></p>
    </section>
    <div className="home-ind"><i /></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);

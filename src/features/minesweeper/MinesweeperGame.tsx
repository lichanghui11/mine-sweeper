'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { DEFAULT_CONFIG, isGameConfig, type GameConfig } from '../../shared/game-config';
import { createGame, reduceGame, type Cell } from './engine';
import { completeClick, completePointerUp, createCellGesture, LONG_PRESS_MS, noteLongPress, notePointerCancel, notePointerMove } from './cell-gesture';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const sounds = ['click', 'expand', 'flag', 'win', 'lose'] as const;
function label(cell: Cell, ended: boolean) {
  if (cell.exploded) return '爆炸';
  if (ended && cell.mine) return '地雷';
  if (ended && cell.mark === 'flag' && !cell.mine) return '错旗';
  if (cell.revealed) return cell.adjacent ? `周围 ${cell.adjacent} 枚雷` : '空白';
  return cell.mark === 'flag' ? '旗帜' : cell.mark === 'question' ? '问号' : '未翻开';
}

export function MinesweeperGame() {
  const [game, dispatch] = useReducer(reduceGame, undefined, () => createGame());
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [clock, setClock] = useState(0);
  const [muted, setMuted] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [effects, setEffects] = useState(false);
  const audio = useRef<Record<string, HTMLAudioElement>>({});
  const gesture = useRef<(ReturnType<typeof createCellGesture> & { timer: ReturnType<typeof setTimeout> | null }) | null>(null);
  const tap = useRef<{ index: number; time: number } | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ended = game.status === 'won' || game.status === 'lost';
  const elapsed = game.startedAt === null ? 0 : Math.max(0, Math.floor(((game.endedAt ?? clock) - game.startedAt) / 1000));
  const flags = game.cells.filter(c => c.mark === 'flag').length;
  const progress = game.cells.filter(c => c.revealed && !c.mine).length;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${basePath}/api/config.json`, { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(c => { if (isGameConfig(c)) setConfig(c); }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (game.status !== 'playing') return;
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, [game.status, game.startedAt]);
  useEffect(() => {
    if (game.event === 'none' || muted) return;
    const sound = audio.current[game.event];
    if (sound) { sound.currentTime = 0; void sound.play().catch(() => {}); }
  }, [game.revision, game.event, muted]);
  useEffect(() => {
    if (!ended) { setEffects(false); return; }
    setEffects(true);
    const timer = setTimeout(() => setEffects(false), game.status === 'won' ? 2500 : 700);
    return () => clearTimeout(timer);
  }, [ended, game.status]);
  useEffect(() => () => {
    if (gesture.current?.timer) clearTimeout(gesture.current.timer);
    Object.values(audio.current).forEach(sound => { sound.pause(); sound.src = ''; });
  }, []);

  function unlockAudio() {
    if (!Object.keys(audio.current).length) for (const key of sounds) {
      const sound = new Audio(`${basePath}/audio/minesweeper_${key}.wav`); sound.preload = 'auto'; audio.current[key] = sound;
    }
  }
  function mark(index: number) { unlockAudio(); tap.current = null; dispatch({ type: 'mark', index, now: Date.now() }); }
  function reveal(index: number) {
    unlockAudio();
    if (flagMode && !game.cells[index].revealed) { mark(index); return; }
    const now = Date.now();
    if (tap.current?.index === index && now - tap.current.time <= 250 && game.cells[index].revealed) {
      tap.current = null; dispatch({ type: 'chord', index, now });
    } else { tap.current = { index, time: now }; dispatch({ type: 'reveal', index, now }); }
  }
  function clearGestureTimer() { if (gesture.current?.timer) clearTimeout(gesture.current.timer); }
  function reset() { clearGestureTimer(); gesture.current = null; tap.current = null; setClock(0); dispatch({ type: 'reset', config }); }

  return <main className={`page ${effects && game.status === 'lost' ? 'shake' : ''}`}>
    <header className="header"><a className="brand" href={`${basePath}/`} aria-label="扫雷首页"><span className="brand-icon">✳</span> 小小扫雷<span className="brand-en">MINESWEEPER</span></a><span className="edition">经典游戏 · 全新一局</span></header>
    <section className="intro"><div className="eyebrow"><span /> 留一点时间，给一点挑战</div><h1>每一步，<span>都有可能。</span></h1><p>放慢一点，发现数字之间的线索。</p></section>
    <section className="game-shell" aria-label="扫雷游戏">
      <div className="game-top"><div><span className={`status-dot ${game.status}`} /><strong>{game.status === 'idle' ? '准备就绪' : game.status === 'playing' ? '排雷进行中' : game.status === 'won' ? '排雷成功' : '下次会更好'}</strong><span className="difficulty">经典 · {game.config.cols} × {game.config.rows}</span></div><button className="sound-button" onClick={() => setMuted(v => !v)} aria-pressed={muted} aria-label={muted ? '开启音效' : '关闭音效'}>{muted ? '♪ 音效关' : '♫ 音效开'}</button></div>
      <div className="hud"><div className="stat"><span className="stat-icon">⚑</span><div><span className="stat-label">剩余地雷</span><strong>{String(game.config.mines - flags).padStart(2, '0')}</strong></div></div><button className="reset" onClick={reset}><span>↻</span> 重新开始</button><div className="stat time"><div><span className="stat-label">本局用时</span><strong>{String(Math.floor(elapsed / 60)).padStart(2, '0')}<span className="colon">:</span>{String(elapsed % 60).padStart(2, '0')}</strong></div><span className="stat-icon">◷</span></div></div>
      <div className={`board-wrap ${ended && game.status === 'lost' ? 'dim' : ''}`}><div className="board" role="group" aria-label="扫雷棋盘" style={{ gridTemplateColumns: `repeat(${game.config.cols}, minmax(26px, 1fr))` }}>
        {game.cells.map((cell, index) => {
          const text = cell.exploded ? '💥' : ended && cell.mine ? (cell.mark === 'flag' && game.status === 'lost' ? '🚩' : '💣') : ended && cell.mark === 'flag' ? '✕' : cell.revealed ? cell.adjacent || '' : cell.mark === 'flag' ? '🚩' : cell.mark === 'question' ? '?' : '';
          const appearance = cell.exploded ? 'exploded' : ended && cell.mine ? 'mine' : ended && cell.mark === 'flag' ? 'mistake' : cell.revealed ? 'revealed' : 'hidden';
          return <button key={index} ref={el => { cellRefs.current[index] = el; }} className={`cell ${appearance} num-${cell.adjacent}`} style={game.status === 'won' && cell.mine ? { animationDelay: `${(Math.floor(index / game.config.cols) + index % game.config.cols) * 30}ms` } : undefined} aria-label={`第 ${Math.floor(index / game.config.cols) + 1} 行，第 ${index % game.config.cols + 1} 列，${label(cell, ended)}`} aria-disabled={ended} tabIndex={index === 0 ? 0 : -1}
            onContextMenu={e => { e.preventDefault(); clearGestureTimer(); if (gesture.current) notePointerCancel(gesture.current); mark(index); }}
            onPointerDown={e => {
              if (e.button !== 0 || ended) return; unlockAudio(); clearGestureTimer();
              const g = { ...createCellGesture({ index, x: e.clientX, y: e.clientY, pointerType: e.pointerType }), timer: null as ReturnType<typeof setTimeout> | null };
              gesture.current = g;
              if (typeof e.currentTarget.setPointerCapture === 'function') e.currentTarget.setPointerCapture(e.pointerId);
              if (g.longPress) g.timer = setTimeout(() => { if (noteLongPress(g) === 'mark') mark(index); }, LONG_PRESS_MS);
            }}
            onPointerMove={e => { const g = gesture.current; if (g && notePointerMove(g, e.clientX, e.clientY) === 'cancel') clearGestureTimer(); }}
            onPointerUp={() => { const g = gesture.current; clearGestureTimer(); if (g && completePointerUp(g) === 'reveal') reveal(index); }}
            onPointerCancel={() => { const g = gesture.current; clearGestureTimer(); if (g) notePointerCancel(g); }}
            onClick={e => { const g = gesture.current; const action = completeClick(g, e.detail, index); if (g?.index === index) gesture.current = null; if (action === 'reveal') reveal(index); }}
            onKeyDown={e => {
              if (e.key.toLowerCase() === 'f') { e.preventDefault(); mark(index); }
              if (e.key.toLowerCase() === 'c') { e.preventDefault(); unlockAudio(); dispatch({ type: 'chord', index, now: Date.now() }); }
              const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -game.config.cols, ArrowDown: game.config.cols };
              if (e.key in offsets) { e.preventDefault(); const next = index + offsets[e.key]; if (next >= 0 && next < game.cells.length && (e.key !== 'ArrowLeft' || index % game.config.cols !== 0) && (e.key !== 'ArrowRight' || index % game.config.cols !== game.config.cols - 1)) { e.currentTarget.tabIndex = -1; const button = cellRefs.current[next]; if (button) { button.tabIndex = 0; button.focus(); } } }
            }}>{text}</button>;
        })}
      </div></div>
      <div className="game-bottom"><p role="status" aria-live="polite">{game.status === 'idle' ? '✦ 点击任意方块开始，第一步总是安全的。' : game.status === 'playing' ? '✦ 相信数字，也相信你的判断。' : game.status === 'won' ? '✦ 恭喜你，所有安全区域都已找到！' : '✦ 踩到雷了，重新开始再试一次吧。'}</p><span>{progress} / {game.config.rows * game.config.cols - game.config.mines}</span></div>
      <div className="mobile-controls"><button onClick={() => setFlagMode(v => !v)} aria-pressed={flagMode}>{flagMode ? '🚩 标记模式' : '◇ 翻开模式'} <span>点击切换</span></button></div>
    </section>
    <section className="rules"><div className="rules-heading"><h2>玩法很简单</h2><span>一点耐心，一点推理</span></div><div className="rule-grid"><article><span className="rule-number">01</span><h3>翻开方块</h3><p>单击翻格，空白区域自动展开。<br />首击及周围八格不会有雷。</p><kbd>单击 / 轻点</kbd></article><article><span className="rule-number">02</span><h3>留下标记</h3><p>未标记 → 🚩 → ? 循环。<br />旗帜保护方块，问号可直接翻开。</p><kbd>右键 / 长按</kbd></article><article><span className="rule-number">03</span><h3>快速排雷</h3><p>邻近旗数等于数字时，双击数字<br />展开邻格。标错旗也可能踩雷。</p><kbd>双击数字</kbd></article></div><p className="keyboard-tip">翻开所有非雷格即可获胜，无需插满旗帜。键盘：方向键移动 · Enter / 空格翻开 · F 标记 · C 快速开</p></section>
    <footer>不赶时间，享受每一次恰好的判断。<span>MADE FOR A LITTLE BREAK</span></footer>
    {effects && game.status === 'lost' && <div className="flash" aria-hidden="true" />}
    {effects && game.status === 'won' && <div className="celebration" aria-hidden="true"><div className="win-banner">✦ 成功啦！ ✦</div>{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.1}s`, background: ['#a6e3bd', '#eac58a', '#b6cfff'][i % 3] }} />)}</div>}
  </main>;
}

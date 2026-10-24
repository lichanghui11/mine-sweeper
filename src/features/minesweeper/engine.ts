import { DEFAULT_CONFIG, isGameConfig, type GameConfig } from '../../shared/game-config';

export type Cell = { mine: boolean; revealed: boolean; mark: 'none' | 'flag' | 'question'; adjacent: number; exploded: boolean };
export type Game = { config: GameConfig; cells: Cell[]; status: 'idle' | 'playing' | 'won' | 'lost'; startedAt: number | null; endedAt: number | null; event: 'none' | 'click' | 'expand' | 'flag' | 'win' | 'lose'; revision: number };
export type Action = { type: 'reset'; config?: GameConfig } | { type: 'reveal' | 'mark' | 'chord'; index: number; now: number; random?: () => number };
export function createGame(config: GameConfig = DEFAULT_CONFIG): Game {
  if (!isGameConfig(config)) throw new RangeError('无效的扫雷配置：棋盘尺寸和雷数必须允许首击九宫格保护');
  return { config: { ...config }, cells: Array.from({ length: config.rows * config.cols }, () => ({ mine: false, revealed: false, mark: 'none', adjacent: 0, exploded: false })), status: 'idle', startedAt: null, endedAt: null, event: 'none', revision: 0 };
}
export function neighbors(index: number, config: GameConfig): number[] {
  const row = Math.floor(index / config.cols), col = index % config.cols, result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const r = row + dr, c = col + dc;
    if ((dr || dc) && r >= 0 && r < config.rows && c >= 0 && c < config.cols) result.push(r * config.cols + c);
  }
  return result;
}
export function reduceGame(state: Game, action: Action): Game {
  if (action.type === 'reset') return createGame(action.config ?? state.config);
  if (state.status === 'won' || state.status === 'lost' || !Number.isInteger(action.index) || !state.cells[action.index]) return state;
  const target = state.cells[action.index];
  if (action.type === 'mark' && target.revealed) return state;
  if (action.type === 'reveal' && (target.revealed || target.mark === 'flag')) return state;
  if (action.type === 'chord' && (!target.revealed || !target.adjacent)) return state;
  const game: Game = { ...state, cells: state.cells.map(c => ({ ...c })), revision: state.revision + 1 };
  const cell = game.cells[action.index];
  if (action.type === 'mark') {
    cell.mark = cell.mark === 'none' ? 'flag' : cell.mark === 'flag' && game.config.questionMarksEnabled ? 'question' : 'none';
    game.event = 'flag'; return game;
  }
  let targets = [action.index];
  if (action.type === 'chord') {
    const nearby = neighbors(action.index, game.config);
    if (nearby.filter(i => game.cells[i].mark === 'flag').length !== cell.adjacent) return state;
    targets = nearby.filter(i => !game.cells[i].revealed && game.cells[i].mark !== 'flag');
    if (!targets.length) return state;
  }
  if (game.status === 'idle') {
    const safe = new Set([action.index, ...neighbors(action.index, game.config)]);
    const available = game.cells.map((_, i) => i).filter(i => !safe.has(i));
    const random = action.random ?? Math.random;
    for (let i = available.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [available[i], available[j]] = [available[j], available[i]]; }
    for (const i of available.slice(0, game.config.mines)) game.cells[i].mine = true;
    game.cells.forEach((c, i) => { c.adjacent = neighbors(i, game.config).filter(n => game.cells[n].mine).length; });
    game.startedAt = action.now; game.status = 'playing';
  }
  const queue = [...targets]; let opened = 0;
  while (queue.length) {
    const index = queue.pop()!, current = game.cells[index];
    if (current.revealed || current.mark === 'flag') continue;
    current.revealed = true; current.mark = 'none'; opened++;
    if (current.mine) { current.exploded = true; game.status = 'lost'; break; }
    if (!current.adjacent) queue.push(...neighbors(index, game.config).filter(i => !game.cells[i].revealed && !game.cells[i].mine));
  }
  if (game.status !== 'lost' && game.cells.every(c => c.mine || c.revealed)) game.status = 'won';
  if (game.status === 'won' || game.status === 'lost') game.endedAt = action.now;
  game.event = game.status === 'lost' ? 'lose' : game.status === 'won' ? 'win' : opened > 1 ? 'expand' : 'click';
  return game;
}

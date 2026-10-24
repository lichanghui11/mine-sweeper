import { describe, expect, it } from 'vitest';
import { createGame, neighbors, reduceGame, type Game } from '../src/features/minesweeper/engine';
import { DEFAULT_CONFIG } from '../src/shared/game-config';
import { api } from '../src/server/app';

const reveal = (game: Game, index: number) => reduceGame(game, { type: 'reveal', index, now: 1000, random: () => 0.42 });
describe('扫雷规则', () => {
  it('拒绝不能保证首击九宫格安全的配置，包括重开', () => {
    for (const config of [
      { ...DEFAULT_CONFIG, rows: 3, cols: 3, mines: 1 },
      { ...DEFAULT_CONFIG, mines: 136 },
      { ...DEFAULT_CONFIG, rows: 3.5 },
      { ...DEFAULT_CONFIG, mines: -1 },
    ]) {
      expect(() => createGame(config)).toThrow(RangeError);
      expect(() => reduceGame(createGame(), { type: 'reset', config })).toThrow(RangeError);
    }
  });
  it('高密度棋盘每个首击位置都保留准确雷数和数字', () => {
    const config = { ...DEFAULT_CONFIG, rows: 4, cols: 4, mines: 7 };
    for (let index = 0; index < 16; index++) {
      const game = reveal(createGame(config), index);
      expect(game.cells.filter(c => c.mine)).toHaveLength(7);
      for (const i of [index, ...neighbors(index, config)]) expect(game.cells[i].mine).toBe(false);
      game.cells.forEach((cell, i) => {
        expect(cell.adjacent).toBe(neighbors(i, config).filter(n => game.cells[n].mine).length);
      });
    }
  });
  it('快速开踩雷后立即停止，不继续翻开其他安全格', () => {
    const game = createGame({ ...DEFAULT_CONFIG, rows: 3, cols: 4, mines: 1 });
    game.status = 'playing'; game.startedAt = 1;
    game.cells[10].mine = true;
    game.cells.forEach((cell, i) => { cell.adjacent = neighbors(i, game.config).includes(10) ? 1 : 0; });
    game.cells[5].revealed = true;
    game.cells[0].mark = 'flag';
    const lost = reduceGame(game, { type: 'chord', index: 5, now: 3 });
    expect(lost.status).toBe('lost');
    expect(lost.cells[10].exploded).toBe(true);
    expect(lost.cells.filter(c => c.revealed && !c.mine)).toHaveLength(1);
    expect(lost.endedAt).toBe(3);
    expect(game.cells[10].revealed).toBe(false);
  });
  for (const index of [0, 6, 65, 143]) it(`首击 ${index} 保护九宫格且固定雷数`, () => {
    const before = createGame(); const game = reveal(before, index);
    expect(game.cells.filter(c => c.mine)).toHaveLength(26);
    for (const i of [index, ...neighbors(index, game.config)]) expect(game.cells[i].mine).toBe(false);
    expect(game.cells[index].revealed).toBe(true);
    expect(before.cells.every(c => !c.mine && !c.revealed)).toBe(true);
  });
  it('标记循环不启动计时，旗帜不可翻开，问号可以翻开', () => {
    let game = createGame();
    game = reduceGame(game, { type: 'mark', index: 0, now: 1 });
    expect(game.cells[0].mark).toBe('flag'); expect(game.startedAt).toBeNull();
    expect(reveal(game, 0)).toBe(game);
    game = reduceGame(game, { type: 'mark', index: 0, now: 2 });
    expect(game.cells[0].mark).toBe('question');
    expect(reveal(game, 0).cells[0].revealed).toBe(true);
    game = reduceGame(game, { type: 'mark', index: 0, now: 3 });
    expect(game.cells[0].mark).toBe('none');
  });
  it('关闭问号时两态循环', () => {
    let game = createGame({ ...DEFAULT_CONFIG, questionMarksEnabled: false });
    for (let i = 0; i < 2; i++) game = reduceGame(game, { type: 'mark', index: 0, now: 1 });
    expect(game.cells[0].mark).toBe('none');
  });
  it('已翻格不能标记，扩散跳过旗帜', () => {
    let game = reduceGame(createGame(), { type: 'mark', index: 0, now: 1 });
    game = reveal(game, 1);
    expect(game.cells[0].revealed).toBe(false);
    expect(reduceGame(game, { type: 'mark', index: 1, now: 2 })).toBe(game);
  });
  it('翻开所有安全格即胜利，终局冻结，重开清空', () => {
    let game = reveal(createGame(), 0);
    const safe = game.cells.map((c, i) => !c.mine ? i : -1).filter(i => i >= 0);
    for (const i of safe) game = reveal(game, i);
    expect(game.status).toBe('won'); expect(game.endedAt).toBe(1000);
    expect(reduceGame(game, { type: 'mark', index: 0, now: 4 })).toBe(game);
    const reset = reduceGame(game, { type: 'reset' });
    expect(reset.status).toBe('idle'); expect(reset.startedAt).toBeNull(); expect(reset.cells.every(c => !c.mine && !c.revealed && c.mark === 'none')).toBe(true);
  });
  it('踩雷失败并停止计时', () => {
    const game = reveal(createGame(), 0), index = game.cells.findIndex(c => c.mine);
    const lost = reduceGame(game, { type: 'reveal', index, now: 9000 });
    expect(lost.status).toBe('lost'); expect(lost.cells[index].exploded).toBe(true); expect(lost.endedAt).toBe(9000);
  });
  function chordFixture() {
    const game = createGame({ version: 1, rows: 3, cols: 4, mines: 1, questionMarksEnabled: true });
    game.status = 'playing'; game.startedAt = 1; game.cells[0].mine = true;
    game.cells.forEach((cell, i) => { cell.adjacent = neighbors(i, game.config).includes(0) ? 1 : 0; });
    game.cells[5].revealed = true; return game;
  }
  it('快速开旗数不符无操作，正确旗展开并胜利', () => {
    let game = chordFixture();
    expect(reduceGame(game, { type: 'chord', index: 5, now: 2 })).toBe(game);
    game = reduceGame(game, { type: 'mark', index: 0, now: 2 });
    game = reduceGame(game, { type: 'chord', index: 5, now: 3 });
    expect(game.status).toBe('won');
  });
  it('快速开旗数匹配但误标时失败', () => {
    let game = chordFixture(); game = reduceGame(game, { type: 'mark', index: 1, now: 2 });
    expect(reduceGame(game, { type: 'chord', index: 5, now: 3 }).status).toBe('lost');
  });
});
describe('Hono API', () => {
  it('健康检查与默认配置', async () => {
    expect(await (await api.request('/api/health')).json()).toEqual({ status: 'ok' });
    expect(await (await api.request('/api/config')).json()).toEqual(DEFAULT_CONFIG);
    expect((await api.request('/api/missing')).status).toBe(404);
  });
});

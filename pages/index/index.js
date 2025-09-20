const DEFAULT_WIDTH = 12;
const DEFAULT_HEIGHT = 12;
const DEFAULT_MINES = 26;
const CELL_SIZE = 48;
const CELL_BORDER = 4;
const BOARD_PADDING = 16; // 与 .board padding 对齐
const BOARD_BORDER = 4; // 与 .board border-width 对齐
const CELL_OUTER_SIZE = CELL_SIZE + CELL_BORDER * 2;
const DOUBLE_TAP_THRESHOLD = 250;

const Minesweeper = require("../../utils/minesweeper.js");

function calculateBoardPixelSize(width) {
  return width * CELL_OUTER_SIZE + 2 * (BOARD_PADDING + BOARD_BORDER);
}

Page({
  data: {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minesCount: DEFAULT_MINES,
    board: [],
    flags: [],
    displayGrid: [],
    remainingMines: DEFAULT_MINES,
    elapsed: 0,
    timerRunning: false,
    firstClickDone: false,
    gameState: "idle",
    statusMessage: "点击任意方块开始游戏",
    questionMarksEnabled: true,
    boardPixelSize: calculateBoardPixelSize(DEFAULT_WIDTH),
    cellSize: CELL_SIZE,
    cellBorder: CELL_BORDER,
    cellOuterSize: CELL_OUTER_SIZE,
    safeCells: DEFAULT_WIDTH * DEFAULT_HEIGHT - DEFAULT_MINES,
    revealedSafeCount: 0,
    shakeActive: false,
    flashActive: false,
    dimBoard: false,
    explosionCell: null,
    winCelebration: false,
  },

  onLoad() {
    this.lastTap = null;
    this.resetGame();
  },

  onUnload() {
    this.stopLoseEffectTimers();
    this.clearTimer();
  },

  handleReset() {
    this.resetGame();
  },

  handleCellTap(e) {
    const { row, col } = e.currentTarget.dataset;
    if (row === undefined || col === undefined) return;
    const now = e.timeStamp;
    const board = this.data.board;
    const cellValue = board && board[row] ? board[row][col] : null;

    if (
      this.lastTap &&
      now - this.lastTap.time < DOUBLE_TAP_THRESHOLD &&
      this.lastTap.row === row &&
      this.lastTap.col === col &&
      cellValue >= "1" &&
      cellValue <= "8"
    ) {
      this.lastTap = null;
      this.processQuickOpen(row, col);
      return;
    }

    this.lastTap = { row, col, time: now };
    this.processCellTap(row, col);
  },

  handleCellLongPress(e) {
    const { row, col } = e.currentTarget.dataset;
    if (row === undefined || col === undefined) return;
    this.lastTap = null;
    this.toggleFlag(row, col);
  },

  resetGame() {
    const { width, height, minesCount } = this.data;
    const board = Minesweeper.createEmptyBoard(height, width);
    const flags = this.createMatrix(height, width, " ");
    this.clearTimer();
    this.lastTap = null;
    this.stopLoseEffectTimers();
    this.setData({
      board,
      flags,
      displayGrid: this.composeDisplayGrid(board, flags, "idle"),
      remainingMines: minesCount,
      elapsed: 0,
      timerRunning: false,
      firstClickDone: false,
      gameState: "idle",
      statusMessage: "点击任意方块开始游戏",
      boardPixelSize: calculateBoardPixelSize(width),
      safeCells: width * height - minesCount,
      revealedSafeCount: 0,
      shakeActive: false,
      flashActive: false,
      dimBoard: false,
      explosionCell: null,
      winCelebration: false,
    });
  },

  createMatrix(rows, cols, fillValue) {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => fillValue)
    );
  },

  composeDisplayGrid(board, flags, gameState) {
    return board.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const flag = flags[rowIndex][colIndex];
        const base = {
          id: `${rowIndex}-${colIndex}`,
          row: rowIndex,
          col: colIndex,
          flag,
          numberClass: "",
        };

        if (cell === Minesweeper.EXPLODED) {
          const isExplosionCenter =
            this.data.explosionCell &&
            this.data.explosionCell.row === rowIndex &&
            this.data.explosionCell.col === colIndex;
          return {
            ...base,
            state: "exploded",
            text: "💥",
            exploding: isExplosionCenter,
          };
        }

        if (cell === "F") {
          return { ...base, state: "mistake", text: "✖" };
        }

        if (cell === Minesweeper.BLANK) {
          return { ...base, state: "blank", text: "" };
        }

        if (cell >= "1" && cell <= "8") {
          return {
            ...base,
            state: "number",
            text: cell,
            numberClass: `cell--num-${cell}`,
          };
        }

        const shouldRevealMine = gameState === "lost" || gameState === "won";
        if (cell === Minesweeper.MINE && shouldRevealMine) {
          if (flag === "P") {
            return { ...base, state: "flag", text: "🚩" };
          }
          return { ...base, state: "mine", text: "💣" };
        }

        if (flag === "P") {
          return { ...base, state: "flag", text: "🚩" };
        }
        if (flag === "?" && this.data.questionMarksEnabled) {
          return { ...base, state: "question", text: "?" };
        }
        return { ...base, state: "hidden", text: "" };
      })
    );
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.data.timerRunning) {
      this.setData({ timerRunning: false });
    }
  },

  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.setData({ elapsed: this.data.elapsed + 1 });
    }, 1000);
    this.setData({ timerRunning: true });
  },

  processCellTap(row, col) {
    const {
      board,
      flags,
      firstClickDone,
      gameState,
      minesCount,
      revealedSafeCount,
      safeCells,
    } = this.data;

    if (gameState === "lost" || gameState === "won") return;
    if (flags[row][col] === Minesweeper.FLAG) return;

    let workingBoard = board.map((r) => r.slice());
    let nextFirstClickDone = firstClickDone;
    let nextGameState = gameState;
    let statusMessage = this.data.statusMessage;

    if (!firstClickDone) {
      workingBoard = Minesweeper.seedMines(workingBoard, minesCount, [
        row,
        col,
      ]);
      nextFirstClickDone = true;
      nextGameState = "playing";
      statusMessage = "小心谨慎，祝你好运！";
      this.startTimer();
    }

    const {
      board: revealedBoard,
      revealedSafe,
      exploded,
      revealed,
    } = Minesweeper.revealCell(workingBoard, flags, row, col);

    let nextBoard = revealedBoard;
    let updatedRevealedSafe = revealedSafeCount + revealedSafe;
    let nextStatus = statusMessage;
    let nextState = nextGameState;

    if (exploded) {
      nextBoard = Minesweeper.revealMinesAndMarkMistakes(revealedBoard, flags);
      nextState = "lost";
      nextStatus = "踩到雷了，再试一次吧";
      this.clearTimer();
      const explosionCell = this.pickExplosionCell(nextBoard, revealed);
      this.triggerLoseEffects(explosionCell);
    } else {
      if (revealedSafe > 0) {
        nextState = "playing";
      }
      if (updatedRevealedSafe >= safeCells) {
        nextState = "won";
        nextStatus = "恭喜你，成功排雷！";
        this.clearTimer();
        nextBoard = Minesweeper.revealMinesAndMarkMistakes(
          revealedBoard,
          flags
        );
        this.triggerWinEffects();
      }
    }

    this.setData({
      board: nextBoard,
      displayGrid: this.composeDisplayGrid(nextBoard, flags, nextState),
      firstClickDone: nextFirstClickDone,
      gameState: nextState,
      statusMessage: nextStatus,
      revealedSafeCount: updatedRevealedSafe,
    });
  },

  processQuickOpen(row, col) {
    const {
      board,
      flags,
      firstClickDone,
      gameState,
      revealedSafeCount,
      safeCells,
    } = this.data;

    if (!firstClickDone) return;
    if (gameState === "lost" || gameState === "won") return;
    const center = board[row][col];
    if (!(center >= "1" && center <= "8")) return;

    const {
      board: expandedBoard,
      exploded,
      revealedSafe,
      revealed,
    } = Minesweeper.chordOpen(board, flags, row, col);

    if (!exploded && revealedSafe === 0) {
      return;
    }

    let nextBoard = expandedBoard;
    let updatedRevealedSafe = revealedSafeCount + revealedSafe;
    let nextState = gameState;
    let nextStatus = this.data.statusMessage;

    if (exploded) {
      nextBoard = Minesweeper.revealMinesAndMarkMistakes(expandedBoard, flags);
      nextState = "lost";
      nextStatus = "捷径失败，踩到雷了！";
      this.clearTimer();
      const explosionCell = this.pickExplosionCell(nextBoard, revealed);
      this.triggerLoseEffects(explosionCell);
    } else {
      if (revealedSafe > 0) {
        nextState = "playing";
      }
      if (updatedRevealedSafe >= safeCells) {
        nextState = "won";
        nextStatus = "恭喜你，成功排雷！";
        this.clearTimer();
        nextBoard = Minesweeper.revealMinesAndMarkMistakes(
          expandedBoard,
          flags
        );
        this.triggerWinEffects();
      }
    }

    this.setData({
      board: nextBoard,
      displayGrid: this.composeDisplayGrid(nextBoard, flags, nextState),
      gameState: nextState,
      statusMessage: nextStatus,
      revealedSafeCount: updatedRevealedSafe,
    });
  },

  toggleFlag(row, col) {
    const { gameState, flags, board, minesCount, questionMarksEnabled } =
      this.data;
    if (gameState === "lost" || gameState === "won") return;

    const nextFlags = flags.map((r) => r.slice());
    const current = nextFlags[row][col];
    let next = " ";
    if (current === " ") {
      next = "P";
    } else if (current === "P") {
      next = questionMarksEnabled ? "?" : " ";
    } else if (current === "?") {
      next = " ";
    }
    nextFlags[row][col] = next;

    const remainingMines = minesCount - Minesweeper.countFlags(nextFlags);
    this.setData({
      flags: nextFlags,
      remainingMines,
      displayGrid: this.composeDisplayGrid(
        board,
        nextFlags,
        this.data.gameState
      ),
    });
  },

  pickExplosionCell(board, revealedCells = []) {
    if (Array.isArray(revealedCells)) {
      const hit = revealedCells.find(
        ([r, c]) => board[r] && board[r][c] === Minesweeper.EXPLODED
      );
      if (hit) {
        return { row: hit[0], col: hit[1] };
      }
    }
    for (let r = 0; r < board.length; r += 1) {
      for (let c = 0; c < board[0].length; c += 1) {
        if (board[r][c] === Minesweeper.EXPLODED) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  },

  triggerLoseEffects(explosionCell) {
    this.stopLoseEffectTimers();

    this.setData({
      shakeActive: true,
      flashActive: true,
      dimBoard: true,
      explosionCell,
      winCelebration: false,
    });

    this.shakeTimer = setTimeout(() => {
      this.setData({ shakeActive: false });
      this.shakeTimer = null;
    }, 500);

    this.flashTimer = setTimeout(() => {
      this.setData({ flashActive: false });
      this.flashTimer = null;
    }, 700);
  },

  stopLoseEffectTimers() {
    if (this.shakeTimer) {
      clearTimeout(this.shakeTimer);
      this.shakeTimer = null;
    }
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
  },

  triggerWinEffects() {
    if (this.winTimer) {
      clearTimeout(this.winTimer);
      this.winTimer = null;
    }

    this.setData({ winCelebration: true, dimBoard: false, flashActive: false });

    this.winTimer = setTimeout(() => {
      this.setData({ winCelebration: false });
      this.winTimer = null;
    }, 2500);
  },
});

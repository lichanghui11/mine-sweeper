const DEFAULT_WIDTH = 12
const DEFAULT_HEIGHT = 12
const DEFAULT_MINES = 10
const CELL_SIZE = 48
const CELL_BORDER = 4
const BOARD_PADDING = 16 // 与 .board padding 对齐
const BOARD_BORDER = 4 // 与 .board border-width 对齐
const CELL_OUTER_SIZE = CELL_SIZE + CELL_BORDER * 2

function calculateBoardPixelSize(width) {
  return width * CELL_OUTER_SIZE + 2 * (BOARD_PADDING + BOARD_BORDER)
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
    gameState: 'idle',
    statusMessage: '点击任意方块开始游戏',
    questionMarksEnabled: true,
    boardPixelSize: calculateBoardPixelSize(DEFAULT_WIDTH),
    cellSize: CELL_SIZE,
    cellBorder: CELL_BORDER,
    cellOuterSize: CELL_OUTER_SIZE
  },

  onLoad() {
    this.resetGame()
  },

  onUnload() {
    this.clearTimer()
  },

  handleReset() {
    this.resetGame()
  },

  handleCellTap(e) {
    const { row, col } = e.currentTarget.dataset
    if (row === undefined || col === undefined) return
    console.log('tap cell', row, col)
  },

  handleCellLongPress(e) {
    const { row, col } = e.currentTarget.dataset
    if (row === undefined || col === undefined) return
    console.log('long press cell', row, col)
  },

  resetGame() {
    const { width, height, minesCount } = this.data
    const board = this.createMatrix(height, width, 'E')
    const flags = this.createMatrix(height, width, ' ')
    this.clearTimer()
    this.setData({
      board,
      flags,
      displayGrid: this.composeDisplayGrid(board, flags),
      remainingMines: minesCount,
      elapsed: 0,
      timerRunning: false,
      firstClickDone: false,
      gameState: 'idle',
      statusMessage: '点击任意方块开始游戏',
      boardPixelSize: calculateBoardPixelSize(width)
    })
  },

  createMatrix(rows, cols, fillValue) {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fillValue))
  },

  composeDisplayGrid(board, flags) {
    return board.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const flag = flags[rowIndex][colIndex]
        const isFlag = flag === 'P'
        const isQuestion = flag === '?'
        return {
          id: `${rowIndex}-${colIndex}`,
          row: rowIndex,
          col: colIndex,
          state: 'hidden',
          flag,
          text: isFlag ? 'F' : isQuestion ? '?' : '',
          numberClass: ''
        }
      })
    )
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
})

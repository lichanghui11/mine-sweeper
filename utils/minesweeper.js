const EMPTY = 'E'
const MINE = 'M'
const BLANK = 'B'
const EXPLODED = 'X'
const FLAG = 'P'

function createEmptyBoard(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => EMPTY))
}

function inRange(board, row, col) {
  return row >= 0 && col >= 0 && row < board.length && col < board[0].length
}

function getNeighbors(row, col) {
  const neighbors = []
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r === row && c === col) continue
      neighbors.push([r, c])
    }
  }
  return neighbors
}

function buildSafeZone(row, col) {
  const zone = new Set()
  getNeighbors(row, col).concat([[row, col]]).forEach(([r, c]) => {
    zone.add(`${r},${c}`)
  })
  return zone
}

function seedMines(board, mineCount, firstClick) {
  const rows = board.length
  const cols = board[0].length
  const totalCells = rows * cols
  if (mineCount >= totalCells) {
    throw new Error('mineCount must be less than total cells')
  }
  const safeZone = buildSafeZone(firstClick[0], firstClick[1])
  const available = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`
      if (safeZone.has(key)) continue
      available.push([r, c])
    }
  }
  if (mineCount > available.length) {
    throw new Error('Not enough cells to place mines with safe zone in effect')
  }
  shuffleInPlace(available)
  for (let i = 0; i < mineCount; i++) {
    const [r, c] = available[i]
    board[r][c] = MINE
  }
  return board
}

function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

function cloneBoard(board) {
  return board.map(row => row.slice())
}

function countAdjacentMines(board, row, col) {
  let count = 0
  for (const [r, c] of getNeighbors(row, col)) {
    if (!inRange(board, r, c)) continue
    if (board[r][c] === MINE || board[r][c] === EXPLODED) {
      count++
    }
  }
  return count
}

function revealCell(board, flags, row, col) {
  const nextBoard = cloneBoard(board)
  if (!inRange(nextBoard, row, col)) {
    return { board: nextBoard, revealed: [], revealedSafe: 0, exploded: false }
  }
  if (flags[row][col] === FLAG) {
    return { board: nextBoard, revealed: [], revealedSafe: 0, exploded: false }
  }
  const current = nextBoard[row][col]
  if (current !== EMPTY && current !== MINE) {
    return { board: nextBoard, revealed: [], revealedSafe: 0, exploded: false }
  }
  const revealed = []
  let revealedSafe = 0
  let exploded = false

  const queue = [[row, col]]
  while (queue.length) {
    const [r, c] = queue.pop()
    if (!inRange(nextBoard, r, c)) continue
    if (flags[r][c] === FLAG) continue
    const value = nextBoard[r][c]
    if (value === MINE) {
      nextBoard[r][c] = EXPLODED
      revealed.push([r, c])
      exploded = true
      continue
    }
    if (value !== EMPTY) continue
    const count = countAdjacentMines(nextBoard, r, c)
    revealed.push([r, c])
    revealedSafe++
    if (count === 0) {
      nextBoard[r][c] = BLANK
      for (const [nr, nc] of getNeighbors(r, c)) {
        if (!inRange(nextBoard, nr, nc)) continue
        const neighborValue = nextBoard[nr][nc]
        if (neighborValue === EMPTY && flags[nr][nc] !== FLAG) {
          queue.push([nr, nc])
        }
      }
    } else {
      nextBoard[r][c] = String(count)
    }
  }
  return { board: nextBoard, revealed, revealedSafe, exploded }
}

function revealAllMines(board) {
  const nextBoard = cloneBoard(board)
  for (let r = 0; r < nextBoard.length; r++) {
    for (let c = 0; c < nextBoard[0].length; c++) {
      if (nextBoard[r][c] === MINE) {
        nextBoard[r][c] = MINE
      }
    }
  }
  return nextBoard
}

function revealMinesAndMarkMistakes(board, flags) {
  const nextBoard = cloneBoard(board)
  for (let r = 0; r < nextBoard.length; r++) {
    for (let c = 0; c < nextBoard[0].length; c++) {
      if (nextBoard[r][c] === MINE) {
        if (flags[r][c] === FLAG) {
          // keep as mine but flagged correctly
          continue
        }
        nextBoard[r][c] = MINE
      } else if (flags[r][c] === FLAG && nextBoard[r][c] !== MINE) {
        nextBoard[r][c] = 'F'
      }
    }
  }
  return nextBoard
}

function countRemainingSafeCells(board) {
  let remaining = 0
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const value = board[r][c]
      if (value === EMPTY) remaining++
    }
  }
  return remaining
}

function countFlags(flags) {
  let total = 0
  for (let r = 0; r < flags.length; r++) {
    for (let c = 0; c < flags[0].length; c++) {
      if (flags[r][c] === FLAG) total++
    }
  }
  return total
}

function chordOpen(board, flags, row, col) {
  if (!inRange(board, row, col)) {
    return { board: cloneBoard(board), exploded: false, revealedSafe: 0, revealed: [] }
  }
  const value = board[row][col]
  if (value < '1' || value > '8') {
    return { board: cloneBoard(board), exploded: false, revealedSafe: 0, revealed: [] }
  }
  const requiredFlags = Number(value)
  let flagCount = 0
  for (const [r, c] of getNeighbors(row, col)) {
    if (!inRange(board, r, c)) continue
    if (flags[r][c] === FLAG) flagCount++
  }
  if (flagCount !== requiredFlags) {
    return { board: cloneBoard(board), exploded: false, revealedSafe: 0, revealed: [] }
  }
  let resultBoard = cloneBoard(board)
  let exploded = false
  let revealedSafe = 0
  const revealed = []
  for (const [r, c] of getNeighbors(row, col)) {
    if (!inRange(board, r, c)) continue
    if (flags[r][c] === FLAG) continue
    const { board: updated, exploded: hit, revealedSafe: safeCount, revealed: newlyRevealed } = revealCell(resultBoard, flags, r, c)
    resultBoard = updated
    if (hit) exploded = true
    revealedSafe += safeCount
    revealed.push(...newlyRevealed)
  }
  return { board: resultBoard, exploded, revealedSafe, revealed }
}

module.exports = {
  EMPTY,
  MINE,
  BLANK,
  EXPLODED,
  FLAG,
  createEmptyBoard,
  seedMines,
  revealCell,
  chordOpen,
  countRemainingSafeCells,
  countFlags,
  revealMinesAndMarkMistakes,
  countAdjacentMines
}

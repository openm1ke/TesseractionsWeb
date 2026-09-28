export const BOARD_SIZE = 5

export type Player = 'red' | 'ivory'
export type Orientation = 'horizontal' | 'vertical'

export interface Move {
  player: Player
  column: number
  row: number
  orientation: Orientation
}

export interface Point {
  column: number
  row: number
}

export interface GameResult {
  winner: Player
  path: Point[]
  moveIndexes: number[]
}

export const opponent = (player: Player): Player => player === 'red' ? 'ivory' : 'red'

export const currentPlayer = (moves: Move[]): Player => moves.length % 2 === 0 ? 'red' : 'ivory'

export function edgeKey(move: Move): string {
  return `${move.player}:${move.column}:${move.row}:${move.orientation}`
}

/** A physical board slot is shared by one RED and one crossing IVORY edge. */
export function slotKey(move: Move): string {
  if (move.player === 'red') {
    return move.orientation === 'vertical'
      ? `v:${move.column}:${move.row}`
      : `h:${move.column}:${move.row}`
  }
  return move.orientation === 'horizontal'
    ? `v:${move.column}:${move.row}`
    : `h:${move.column - 1}:${move.row + 1}`
}

export function allMovesFor(player: Player): Move[] {
  const moves: Move[] = []
  if (player === 'red') {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let column = 0; column < BOARD_SIZE; column += 1) {
        moves.push({ player, column, row, orientation: 'vertical' })
      }
    }
    for (let row = 1; row < BOARD_SIZE; row += 1) {
      for (let column = 0; column < BOARD_SIZE - 1; column += 1) {
        moves.push({ player, column, row, orientation: 'horizontal' })
      }
    }
  } else {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let column = 0; column < BOARD_SIZE; column += 1) {
        moves.push({ player, column, row, orientation: 'horizontal' })
      }
    }
    for (let row = 0; row < BOARD_SIZE - 1; row += 1) {
      for (let column = 1; column < BOARD_SIZE; column += 1) {
        moves.push({ player, column, row, orientation: 'vertical' })
      }
    }
  }
  return moves
}

export function legalMovesFor(player: Player, moves: Move[]): Move[] {
  const occupied = new Set(moves.map(slotKey))
  return allMovesFor(player).filter((move) => !occupied.has(slotKey(move)))
}

export function isLegal(move: Move, moves: Move[]): boolean {
  if (move.player !== currentPlayer(moves) || detectWinner(moves)) return false
  return legalMovesFor(move.player, moves).some((candidate) => edgeKey(candidate) === edgeKey(move))
}

export function applyMove(moves: Move[], move: Move): Move[] {
  if (!isLegal(move, moves)) return moves
  return [...moves, move]
}

export function secondPoint(move: Move): Point {
  return move.orientation === 'horizontal'
    ? { column: move.column + 1, row: move.row }
    : { column: move.column, row: move.row + 1 }
}

const pointKey = (point: Point) => `${point.column},${point.row}`

export function findWinningPath(moves: Move[], player: Player): GameResult | null {
  const adjacency = new Map<string, Array<{ point: Point; moveIndex: number }>>()
  const add = (from: Point, to: Point, moveIndex: number) => {
    const key = pointKey(from)
    adjacency.set(key, [...(adjacency.get(key) ?? []), { point: to, moveIndex }])
  }

  moves.forEach((move, moveIndex) => {
    if (move.player !== player) return
    const first = { column: move.column, row: move.row }
    const second = secondPoint(move)
    add(first, second, moveIndex)
    add(second, first, moveIndex)
  })

  const sources: Point[] = []
  const sinks = new Set<string>()
  if (player === 'red') {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      sources.push({ column, row: 0 })
      sinks.add(pointKey({ column, row: BOARD_SIZE }))
    }
  } else {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      sources.push({ column: 0, row })
      sinks.add(pointKey({ column: BOARD_SIZE, row }))
    }
  }

  const queue = [...sources]
  const parents = new Map<string, { point: Point | null; moveIndex: number | null }>()
  for (const source of sources) parents.set(pointKey(source), { point: null, moveIndex: null })

  let reached: Point | null = null
  for (let cursor = 0; cursor < queue.length && !reached; cursor += 1) {
    const point = queue[cursor]
    if (sinks.has(pointKey(point))) {
      reached = point
      break
    }
    for (const next of adjacency.get(pointKey(point)) ?? []) {
      const key = pointKey(next.point)
      if (parents.has(key)) continue
      parents.set(key, { point, moveIndex: next.moveIndex })
      queue.push(next.point)
    }
  }
  if (!reached) return null

  const path: Point[] = []
  const moveIndexes: number[] = []
  let cursor: Point | null = reached
  while (cursor) {
    path.push(cursor)
    const parent: { point: Point | null; moveIndex: number | null } | undefined = parents.get(pointKey(cursor))
    if (parent?.moveIndex != null) moveIndexes.push(parent.moveIndex)
    cursor = parent?.point ?? null
  }
  return { winner: player, path: path.reverse(), moveIndexes: moveIndexes.reverse() }
}

export function detectWinner(moves: Move[]): GameResult | null {
  return findWinningPath(moves, 'red') ?? findWinningPath(moves, 'ivory')
}

export function columnLabel(column: number): string {
  return String.fromCharCode(65 + column)
}

export function moveLabel(move: Move): string {
  return `${columnLabel(move.column)}${move.row + 1}`
}

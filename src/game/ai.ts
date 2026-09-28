import {
  BOARD_SIZE,
  detectWinner,
  legalMovesFor,
  opponent,
  secondPoint,
  slotKey,
  type Move,
  type Player,
} from './engine'

export type Difficulty = 'easy' | 'medium' | 'hard'

function immediateWin(moves: Move[], player: Player): Move | null {
  return legalMovesFor(player, moves).find((move) => detectWinner([...moves, move])?.winner === player) ?? null
}

/** Minimum number of still-free slots needed to join a player's target sides. */
export function pathDistance(moves: Move[], player: Player): number {
  const occupiedBy = new Map(moves.map((move) => [slotKey(move), move.player]))
  const nodeCount = player === 'red'
    ? { columns: BOARD_SIZE, rows: BOARD_SIZE + 1 }
    : { columns: BOARD_SIZE + 1, rows: BOARD_SIZE }
  const distance = new Map<string, number>()
  const queue: Array<{ column: number; row: number; distance: number }> = []
  const key = (column: number, row: number) => `${column},${row}`

  const sources = player === 'red'
    ? Array.from({ length: BOARD_SIZE }, (_, column) => ({ column, row: 0 }))
    : Array.from({ length: BOARD_SIZE }, (_, row) => ({ column: 0, row }))
  for (const source of sources) {
    distance.set(key(source.column, source.row), 0)
    queue.push({ ...source, distance: 0 })
  }

  while (queue.length) {
    queue.sort((a, b) => a.distance - b.distance)
    const current = queue.shift()!
    if (current.distance !== distance.get(key(current.column, current.row))) continue
    const atTarget = player === 'red' ? current.row === BOARD_SIZE : current.column === BOARD_SIZE
    if (atTarget) return current.distance

    const candidates = legalOrOwnedEdgesAt(moves, player, current.column, current.row)
    for (const edge of candidates) {
      const other = edge.column === current.column && edge.row === current.row
        ? secondPoint(edge)
        : { column: edge.column, row: edge.row }
      if (other.column < 0 || other.row < 0 || other.column >= nodeCount.columns || other.row >= nodeCount.rows) continue
      const owner = occupiedBy.get(slotKey(edge))
      if (owner === opponent(player)) continue
      const nextDistance = current.distance + (owner === player ? 0 : 1)
      const otherKey = key(other.column, other.row)
      if (nextDistance < (distance.get(otherKey) ?? Number.POSITIVE_INFINITY)) {
        distance.set(otherKey, nextDistance)
        queue.push({ ...other, distance: nextDistance })
      }
    }
  }
  return 99
}

function legalOrOwnedEdgesAt(moves: Move[], player: Player, column: number, row: number): Move[] {
  const possible = [...legalMovesFor(player, moves), ...moves.filter((move) => move.player === player)]
  return possible.filter((move) => {
    const second = secondPoint(move)
    return (move.column === column && move.row === row) || (second.column === column && second.row === row)
  })
}

function scoreMove(moves: Move[], move: Move, player: Player): number {
  const next = [...moves, move]
  const centre = 4 - Math.abs(move.column - 2) - Math.abs(move.row - 2)
  return (pathDistance(next, opponent(player)) - pathDistance(next, player)) * 100 + centre
}

export function chooseAiMove(moves: Move[], player: Player, difficulty: Difficulty): Move | null {
  const legal = legalMovesFor(player, moves)
  if (!legal.length) return null
  if (difficulty === 'easy') return legal[Math.floor(Math.random() * legal.length)]

  const win = immediateWin(moves, player)
  if (win) return win

  const threat = immediateWin(moves, opponent(player))
  if (threat) {
    const block = legal.find((move) => slotKey(move) === slotKey(threat))
    if (block) return block
  }

  const ranked = legal
    .map((move) => ({ move, score: scoreMove(moves, move, player) }))
    .sort((a, b) => b.score - a.score)

  if (difficulty === 'medium') {
    const pool = ranked.slice(0, Math.min(4, ranked.length))
    return pool[Math.floor(Math.random() * pool.length)].move
  }

  const candidates = ranked.slice(0, Math.min(10, ranked.length))
  let best = candidates[0]
  let bestReplyScore = Number.NEGATIVE_INFINITY
  for (const candidate of candidates) {
    const next = [...moves, candidate.move]
    const replies = legalMovesFor(opponent(player), next)
      .map((reply) => scoreMove(next, reply, opponent(player)))
      .sort((a, b) => b - a)
    const safeScore = candidate.score - (replies[0] ?? 0) * 0.72
    if (safeScore > bestReplyScore) {
      bestReplyScore = safeScore
      best = candidate
    }
  }
  return best.move
}

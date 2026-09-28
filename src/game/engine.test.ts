import { describe, expect, it } from 'vitest'
import { allMovesFor, applyMove, detectWinner, legalMovesFor, slotKey, type Move } from './engine'

describe('canonical Tesseractions rules', () => {
  it('builds 41 legal edges for each color', () => {
    expect(allMovesFor('red')).toHaveLength(41)
    expect(allMovesFor('ivory')).toHaveLength(41)
  })

  it('pairs every red and ivory edge into the same 41 physical slots', () => {
    expect(new Set(allMovesFor('red').map(slotKey))).toEqual(new Set(allMovesFor('ivory').map(slotKey)))
  })

  it('blocks the crossing edge after a piece occupies a slot', () => {
    const red: Move = { player: 'red', column: 2, row: 2, orientation: 'vertical' }
    const moves = applyMove([], red)
    const crossing = legalMovesFor('ivory', moves).find((move) => move.column === 2 && move.row === 2 && move.orientation === 'horizontal')
    expect(crossing).toBeUndefined()
    expect(legalMovesFor('ivory', moves)).toHaveLength(40)
  })

  it('detects a red top-to-bottom path', () => {
    const moves: Move[] = []
    for (let row = 0; row < 5; row += 1) {
      moves.push({ player: 'red', column: 0, row, orientation: 'vertical' })
      if (row < 4) moves.push({ player: 'ivory', column: 1, row, orientation: 'horizontal' })
    }
    const result = detectWinner(moves)
    expect(result?.winner).toBe('red')
    expect(result?.path).toHaveLength(6)
  })

  it('detects an ivory left-to-right path', () => {
    const moves: Move[] = []
    for (let column = 0; column < 5; column += 1) {
      moves.push(column < 4
        ? { player: 'red', column, row: 1, orientation: 'horizontal' }
        : { player: 'red', column: 0, row: 2, orientation: 'horizontal' })
      moves.push({ player: 'ivory', column, row: 0, orientation: 'horizontal' })
    }
    const result = detectWinner(moves)
    expect(result?.winner).toBe('ivory')
    expect(result?.path).toHaveLength(6)
  })
})

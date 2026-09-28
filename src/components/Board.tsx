import type { CSSProperties } from 'react'
import {
  BOARD_SIZE,
  columnLabel,
  edgeKey,
  legalMovesFor,
  moveLabel,
  secondPoint,
  type Move,
  type Player,
} from '../game/engine'
import type { Language } from '../game/storage'

interface BoardProps {
  moves: Move[]
  activePlayer: Player
  selected: Move | null
  coordinates: boolean
  hints: boolean
  interactive: boolean
  winningMoveIndexes?: number[]
  focusedMoveIndex?: number | null
  language: Language
  onSlot: (move: Move) => void
}

const INNER = 78
const INNER_SIZE = 844
const RAIL = 46.9
const ORIGIN = INNER + RAIL / 2
const EXTENT = INNER_SIZE - RAIL
const CELL = EXTENT / BOARD_SIZE
const NODE = 46.9

function point(player: Player, column: number, row: number) {
  return player === 'red'
    ? { x: ORIGIN + CELL / 2 + column * CELL, y: ORIGIN + row * CELL }
    : { x: ORIGIN + column * CELL, y: ORIGIN + CELL / 2 + row * CELL }
}

function slotCentre(move: Move) {
  const first = point(move.player, move.column, move.row)
  const second = secondPoint(move)
  const last = point(move.player, second.column, second.row)
  return { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 }
}

function Piece({ move, preview = false, winning = false, focused = false }: { move: Move; preview?: boolean; winning?: boolean; focused?: boolean }) {
  const center = slotCentre(move)
  const horizontal = move.orientation === 'horizontal'
  const size = NODE * 2.1
  const half = size / 2
  const chamfer = (size - NODE) / 2
  const points = [
    [-half + chamfer, -half], [half - chamfer, -half], [half, -half + chamfer], [half, half - chamfer],
    [half - chamfer, half], [-half + chamfer, half], [-half, half - chamfer], [-half, -half + chamfer],
  ].map(([x, y]) => `${x},${y}`).join(' ')
  const stripeLength = CELL - NODE
  const stripe = horizontal
    ? { x: -stripeLength / 2, y: -NODE / 2, width: stripeLength, height: NODE }
    : { x: -NODE / 2, y: -stripeLength / 2, width: NODE, height: stripeLength }
  const fill = move.player === 'red' ? 'url(#red-piece)' : 'url(#ivory-piece)'
  return (
    <g
      className={`board-piece ${preview ? 'is-preview' : ''} ${winning ? 'is-winning' : ''} ${focused ? 'is-focused' : ''}`}
      transform={`translate(${center.x} ${center.y})`}
    >
      <rect {...stripe} rx={NODE * 0.25} fill="#020506" opacity=".7" transform="translate(0 4)" />
      <rect {...stripe} rx={NODE * 0.25} fill={fill} stroke="rgba(0,0,0,.55)" strokeWidth="3" />
      <polygon points={points} fill="url(#token-body)" stroke="#030506" strokeWidth="5" />
      <polygon points={points} fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="2" />
      <rect {...stripe} rx={NODE * 0.25} fill={fill} clipPath="url(#piece-clip)" />
      {(winning || focused) && <polygon className="piece-focus-ring" points={points} fill="none" stroke={move.player === 'red' ? '#ff7378' : '#fff9e9'} strokeWidth="7" />}
    </g>
  )
}

function Node({ player, column, row }: { player: Player; column: number; row: number }) {
  const center = point(player, column, row)
  return <rect x={center.x - NODE / 2} y={center.y - NODE / 2} width={NODE} height={NODE} rx="4" fill={player === 'red' ? 'url(#red-node)' : 'url(#ivory-node)'} stroke="#020506" strokeWidth="5" />
}

export function Board({ moves, activePlayer, selected, coordinates, hints, interactive, winningMoveIndexes = [], focusedMoveIndex, language, onSlot }: BoardProps) {
  const legal = legalMovesFor(activePlayer, moves)
  const winning = new Set(winningMoveIndexes)
  const label = (move: Move) => {
    const color = language === 'ru' ? (move.player === 'red' ? 'красных' : 'светлых') : move.player
    const direction = language === 'ru'
      ? (move.orientation === 'horizontal' ? 'горизонтально' : 'вертикально')
      : move.orientation
    return `${moveLabel(move)}, ${color}, ${direction}`
  }

  return (
    <div className="board-wrap" data-testid="game-board">
      <svg className="board-svg" viewBox="0 0 1000 1000" role="img" aria-label={language === 'ru' ? 'Игровое поле Tesseractions' : 'Tesseractions game board'}>
        <defs>
          <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#353d42"/><stop offset=".55" stopColor="#1b2226"/><stop offset="1" stopColor="#101519"/></linearGradient>
          <linearGradient id="surface" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#262f33"/><stop offset="1" stopColor="#171e21"/></linearGradient>
          <linearGradient id="red-node" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff5b62"/><stop offset=".5" stopColor="#ef2e37"/><stop offset="1" stopColor="#8f2027"/></linearGradient>
          <linearGradient id="ivory-node" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffdf7"/><stop offset=".55" stopColor="#e9e2d5"/><stop offset="1" stopColor="#99948b"/></linearGradient>
          <linearGradient id="red-piece" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff6066"/><stop offset=".55" stopColor="#e52b34"/><stop offset="1" stopColor="#841d23"/></linearGradient>
          <linearGradient id="ivory-piece" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffef8"/><stop offset=".55" stopColor="#e7dfd2"/><stop offset="1" stopColor="#8f8b84"/></linearGradient>
          <linearGradient id="token-body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4a5257"/><stop offset=".5" stopColor="#252c30"/><stop offset="1" stopColor="#111619"/></linearGradient>
          <clipPath id="piece-clip"><rect x="-49.25" y="-49.25" width="98.5" height="98.5" rx="25" /></clipPath>
          <filter id="board-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity=".55"/></filter>
        </defs>
        <rect x="24" y="24" width="952" height="952" rx="42" fill="url(#frame)" stroke="#505a60" strokeWidth="5" filter="url(#board-shadow)" />
        <path d="M52 72H928L952 96V904L928 928H72L48 904V96Z" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
        <rect x={INNER} y={INNER} width={INNER_SIZE} height={INNER_SIZE} fill="url(#surface)" stroke="#05090b" strokeWidth="8" />
        <rect x={ORIGIN + NODE / 2} y={INNER} width={EXTENT - NODE} height={RAIL} fill="#a7232a" />
        <rect x={ORIGIN + NODE / 2} y={INNER + INNER_SIZE - RAIL} width={EXTENT - NODE} height={RAIL} fill="#a7232a" />
        <rect x={INNER} y={ORIGIN + NODE / 2} width={RAIL} height={EXTENT - NODE} fill="#aaa399" />
        <rect x={INNER + INNER_SIZE - RAIL} y={ORIGIN + NODE / 2} width={RAIL} height={EXTENT - NODE} fill="#aaa399" />
        <g opacity=".13" stroke="#dce2e5" strokeWidth="2">
          {Array.from({ length: 5 }, (_, i) => <line key={`grid-v-${i}`} x1={ORIGIN + CELL / 2 + i * CELL} y1={ORIGIN} x2={ORIGIN + CELL / 2 + i * CELL} y2={ORIGIN + EXTENT} />)}
          {Array.from({ length: 6 }, (_, i) => <line key={`grid-h-${i}`} x1={ORIGIN} y1={ORIGIN + i * CELL} x2={ORIGIN + EXTENT} y2={ORIGIN + i * CELL} />)}
        </g>
        {moves.map((move, index) => <Piece key={`${edgeKey(move)}-${index}`} move={move} winning={winning.has(index)} focused={focusedMoveIndex === index} />)}
        {selected && <Piece move={selected} preview />}
        <g>{Array.from({ length: 6 }, (_, row) => Array.from({ length: 5 }, (__, column) => <Node key={`r-${column}-${row}`} player="red" column={column} row={row} />))}</g>
        <g>{Array.from({ length: 5 }, (_, row) => Array.from({ length: 6 }, (__, column) => <Node key={`i-${column}-${row}`} player="ivory" column={column} row={row} />))}</g>
        {coordinates && <g className="coordinate-labels" aria-hidden="true">
          {Array.from({ length: 5 }, (_, column) => <text key={`rt-${column}`} x={point('red', column, 0).x} y="57" className="red-coordinate">{columnLabel(column)}</text>)}
          {Array.from({ length: 6 }, (_, column) => <text key={`ib-${column}`} x={point('ivory', column, 0).x} y="958" className="ivory-coordinate">{columnLabel(column)}</text>)}
          {Array.from({ length: 5 }, (_, row) => <text key={`il-${row}`} x="52" y={point('ivory', 0, row).y + 8} className="ivory-coordinate">{row + 1}</text>)}
          {Array.from({ length: 6 }, (_, row) => <text key={`rr-${row}`} x="948" y={point('red', 0, row).y + 8} className="red-coordinate">{row + 1}</text>)}
        </g>}
      </svg>
      {interactive && legal.map((move) => {
        const center = slotCentre(move)
        const isSelected = selected ? edgeKey(selected) === edgeKey(move) : false
        const style = { left: `${center.x / 10}%`, top: `${center.y / 10}%` } as CSSProperties
        return <button key={edgeKey(move)} className={`slot-target ${hints ? 'show-hint' : ''} ${isSelected ? 'is-selected' : ''}`} style={style} type="button" aria-label={label(move)} aria-pressed={isSelected} onClick={() => onSlot(move)} />
      })}
    </div>
  )
}

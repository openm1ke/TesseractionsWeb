import type { Player } from './engine'

const pools: Record<Player, string[]> = {
  red: ['./audio/stone_player_1.wav', './audio/stone_player_2.wav', './audio/stone_player_3.wav'],
  ivory: ['./audio/stone_opponent_1.wav', './audio/stone_opponent_2.wav', './audio/stone_opponent_3.wav'],
}

export function playStone(player: Player, enabled: boolean): void {
  if (!enabled) return
  const variants = pools[player]
  const audio = new Audio(variants[Math.floor(Math.random() * variants.length)])
  audio.volume = 0.44
  void audio.play().catch(() => undefined)
}

export function playWin(enabled: boolean): void {
  if (!enabled) return
  const audio = new Audio('./audio/connection.wav')
  audio.volume = 0.5
  void audio.play().catch(() => undefined)
}

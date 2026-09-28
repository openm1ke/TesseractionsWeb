import type { Difficulty } from './ai'
import type { Move, Player } from './engine'

export type Language = 'ru' | 'en'
export type GameMode = 'ai' | 'local'

export interface Settings {
  language: Language
  coordinates: boolean
  hints: boolean
  sound: boolean
  reduceMotion: boolean
  tutorialCompleted: boolean
}

export interface SavedGame {
  mode: GameMode
  difficulty: Difficulty
  humanColor: Player
  moves: Move[]
}

const SETTINGS_KEY = 'tesseractions.settings.v1'
const GAME_KEY = 'tesseractions.active-game.v1'

const defaultLanguage = (): Language => navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'

export function loadSettings(): Settings {
  const fallback: Settings = {
    language: defaultLanguage(),
    coordinates: true,
    hints: true,
    sound: true,
    reduceMotion: typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
    tutorialCompleted: false,
  }
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings> }
  } catch {
    return fallback
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadGame(): SavedGame | null {
  try {
    const game = JSON.parse(localStorage.getItem(GAME_KEY) ?? 'null') as SavedGame | null
    return game && Array.isArray(game.moves) ? game : null
  } catch {
    return null
  }
}

export function saveGame(game: SavedGame): void {
  localStorage.setItem(GAME_KEY, JSON.stringify(game))
}

export function clearGame(): void {
  localStorage.removeItem(GAME_KEY)
}

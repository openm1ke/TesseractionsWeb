import { useEffect, useRef, useState } from 'react'
import { Board } from './components/Board'
import { SettingsIcon } from './components/Icons'
import { TutorialScreen } from './components/TutorialScreen'
import { chooseAiMove, type Difficulty } from './game/ai'
import { playStone, playWin } from './game/audio'
import {
  currentPlayer,
  detectWinner,
  edgeKey,
  moveLabel,
  type Move,
  type Player,
} from './game/engine'
import {
  clearGame,
  loadGame,
  loadSettings,
  saveGame,
  saveSettings,
  type GameMode,
  type SavedGame,
  type Settings,
} from './game/storage'
import { copy } from './i18n/copy'

type Screen = 'menu' | 'setup' | 'game' | 'settings' | 'tutorial' | 'review'
type ColorChoice = Player | 'random'

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}>
    <img src="./brand/tesseractions-icon.svg" alt="" />
    <div><strong>TESSERACTIONS</strong>{!compact && <span>SHAPE · CONNECT · CONQUER</span>}</div>
  </div>
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [saved, setSaved] = useState<SavedGame | null>(loadGame)
  const [game, setGame] = useState<SavedGame | null>(null)
  const [screen, setScreen] = useState<Screen>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [colorChoice, setColorChoice] = useState<ColorChoice>('red')
  const [selected, setSelected] = useState<Move | null>(null)
  const [reviewPly, setReviewPly] = useState(0)
  const [focusedMove, setFocusedMove] = useState<number | null>(null)
  const [tutorialDestination, setTutorialDestination] = useState<'setup' | 'local' | null>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const text = copy[settings.language]

  useEffect(() => {
    document.documentElement.lang = settings.language
    document.documentElement.dataset.reduceMotion = String(settings.reduceMotion)
    saveSettings(settings)
  }, [settings])

  const winner = game ? detectWinner(game.moves) : null
  const activePlayer = game ? currentPlayer(game.moves) : 'red'
  const aiTurn = Boolean(game && game.mode === 'ai' && activePlayer !== game.humanColor && !winner)

  useEffect(() => {
    if (!game || !aiTurn || winner) return
    const timer = window.setTimeout(() => {
      const move = chooseAiMove(game.moves, activePlayer, game.difficulty)
      if (!move) return
      const nextMoves = [...game.moves, move]
      const nextGame = { ...game, moves: nextMoves }
      const result = detectWinner(nextMoves)
      playStone(move.player, settings.sound)
      if (result) {
        playWin(settings.sound)
        clearGame()
        setSaved(null)
      } else {
        saveGame(nextGame)
        setSaved(nextGame)
      }
      setSelected(null)
      setGame(nextGame)
    }, settings.reduceMotion ? 180 : 620)
    return () => window.clearTimeout(timer)
  }, [activePlayer, aiTurn, game, settings.reduceMotion, settings.sound, winner])

  useEffect(() => {
    historyRef.current?.scrollTo({ left: historyRef.current.scrollWidth, behavior: settings.reduceMotion ? 'auto' : 'smooth' })
  }, [game?.moves.length, settings.reduceMotion])

  const updateSettings = (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch }))

  const startGame = (mode: GameMode, chosenDifficulty = difficulty, chosenColor: ColorChoice = colorChoice) => {
    const humanColor: Player = mode === 'local'
      ? 'red'
      : chosenColor === 'random'
        ? (Math.random() < 0.5 ? 'red' : 'ivory')
        : chosenColor
    const next: SavedGame = { mode, difficulty: chosenDifficulty, humanColor, moves: [] }
    setGame(next)
    setSaved(next)
    saveGame(next)
    setSelected(null)
    setFocusedMove(null)
    setScreen('game')
  }

  const requestMode = (mode: GameMode) => {
    if (!settings.tutorialCompleted) {
      setTutorialDestination(mode === 'ai' ? 'setup' : 'local')
      setScreen('tutorial')
      return
    }
    if (mode === 'ai') setScreen('setup')
    else startGame('local')
  }

  const tutorialPrimary = () => {
    updateSettings({ tutorialCompleted: true })
    const destination = tutorialDestination
    setTutorialDestination(null)
    if (destination === 'local') startGame('local')
    else setScreen('setup')
  }

  const tutorialDone = () => {
    updateSettings({ tutorialCompleted: true })
    setTutorialDestination(null)
    setScreen('menu')
  }

  const continueGame = () => {
    if (!saved) return
    setGame(saved)
    setSelected(null)
    setScreen('game')
  }

  const commitMove = (move: Move) => {
    if (!game || winner || aiTurn || move.player !== activePlayer) return
    if (!selected || edgeKey(selected) !== edgeKey(move)) {
      setSelected(move)
      return
    }
    const nextMoves = [...game.moves, move]
    const nextGame = { ...game, moves: nextMoves }
    const result = detectWinner(nextMoves)
    playStone(move.player, settings.sound)
    if (result) {
      playWin(settings.sound)
      clearGame()
      setSaved(null)
    } else {
      saveGame(nextGame)
      setSaved(nextGame)
    }
    setSelected(null)
    setFocusedMove(null)
    setGame(nextGame)
  }

  const leaveGame = () => {
    if (game && !winner) {
      saveGame(game)
      setSaved(game)
    }
    setScreen('menu')
  }

  const restartGame = () => {
    if (!game || !window.confirm(text.restartAsk)) return
    startGame(game.mode, game.difficulty, game.humanColor)
  }

  const endGame = () => {
    if (!window.confirm(text.endAsk)) return
    clearGame()
    setSaved(null)
    setGame(null)
    setScreen('menu')
  }

  if (screen === 'settings') return <SettingsScreen settings={settings} text={text} onChange={updateSettings} onBack={() => setScreen('menu')} />
  if (screen === 'tutorial') return <TutorialScreen text={text} language={settings.language} coordinates={settings.coordinates} sound={settings.sound} primaryLabel={tutorialDestination === 'local' ? text.local : text.lessonPlayVsAi} onBack={() => { setTutorialDestination(null); setScreen('menu') }} onPrimary={tutorialPrimary} onDone={tutorialDone} />
  if (screen === 'setup') return <SetupScreen difficulty={difficulty} color={colorChoice} text={text} onDifficulty={setDifficulty} onColor={setColorChoice} onBack={() => setScreen('menu')} onStart={() => startGame('ai')} />
  if (screen === 'review' && game) {
    return <ReviewScreen game={game} ply={reviewPly} text={text} settings={settings} onPly={setReviewPly} onBack={() => setScreen('game')} />
  }
  if (screen === 'game' && game) {
    const playerName = (player: Player) => game.mode === 'local'
      ? (player === 'red' ? text.player1 : text.player2)
      : (player === game.humanColor ? text.you : text.ai)
    const status = winner
      ? text.win
      : aiTurn
        ? text.aiThinking
        : selected
          ? text.tapAgain
          : game.mode === 'ai'
            ? text.yourTurn
            : `${playerName(activePlayer)} · ${text.playerTurn}`
    return <main className="game-screen">
      <header className="game-topbar">
        <button className="icon-button" type="button" onClick={leaveGame} aria-label={text.menu}>‹</button>
        <Brand compact />
        <button className="icon-button" type="button" onClick={restartGame} aria-label={text.restart}>↻</button>
      </header>
      <section className="game-shell">
        <div className="match-meta">
          <span>{game.mode === 'ai' ? `${text.vsAi} · ${text[game.difficulty]}` : text.local}</span>
          <span>{text.savedLocally}</span>
        </div>
        <div className="player-row">
          <PlayerCard player="ivory" name={playerName('ivory')} active={activePlayer === 'ivory' && !winner} />
          <div className={`turn-status ${activePlayer}`} aria-live="polite"><strong>{status}</strong><span>{!winner && !selected && (activePlayer === 'red' ? text.tapRed : text.tapIvory)}</span></div>
          <PlayerCard player="red" name={playerName('red')} active={activePlayer === 'red' && !winner} />
        </div>
        <div className="board-column">
          <Board moves={game.moves} activePlayer={activePlayer} selected={selected} coordinates={settings.coordinates} hints={settings.hints} interactive={!winner && !aiTurn} winningMoveIndexes={winner?.moveIndexes} focusedMoveIndex={focusedMove} language={settings.language} onSlot={commitMove} />
          {!winner && <MoveHistory moves={game.moves} text={text} focused={focusedMove} onFocus={setFocusedMove} historyRef={historyRef} />}
        </div>
      </section>
      {winner && <ResultPanel winner={winner.winner} text={text} onAgain={() => startGame(game.mode, game.difficulty, game.humanColor)} onReview={() => { setReviewPly(game.moves.length); setScreen('review') }} onMenu={leaveGame} />}
      <button className="quiet-danger game-end" type="button" onClick={endGame}>{text.endMatch}</button>
    </main>
  }

  return <MenuScreen hasSaved={Boolean(saved)} text={text} language={settings.language} onLanguage={(language) => updateSettings({ language })} onContinue={continueGame} onVsAi={() => requestMode('ai')} onLocal={() => requestMode('local')} onRules={() => { setTutorialDestination(null); setScreen('tutorial') }} onSettings={() => setScreen('settings')} />
}

type AppText = typeof copy.ru

function MenuScreen({ hasSaved, text, language, onLanguage, onContinue, onVsAi, onLocal, onRules, onSettings }: {
  hasSaved: boolean; text: AppText; language: Settings['language']; onLanguage: (value: Settings['language']) => void
  onContinue: () => void; onVsAi: () => void; onLocal: () => void; onRules: () => void; onSettings: () => void
}) {
  return <main className="menu-screen">
    <div className="ambient ambient-red" /><div className="ambient ambient-ivory" />
    <header className="menu-topbar">
      <div className="language-switch" role="group" aria-label={text.language}>
        <button type="button" aria-pressed={language === 'ru'} onClick={() => onLanguage('ru')}>RU</button>
        <button type="button" aria-pressed={language === 'en'} onClick={() => onLanguage('en')}>EN</button>
      </div>
      <button className="icon-button" type="button" onClick={onSettings} aria-label={text.settings}><SettingsIcon /></button>
    </header>
    <section className="hero">
      <Brand />
      <div className="hero-board" aria-hidden="true"><img src="./brand/tesseractions-icon.svg" alt="" /></div>
      <div className="menu-actions">
        {hasSaved && <button className="primary-button continue-button" type="button" onClick={onContinue}><span>{text.continue}<small>{text.savedLocally}</small></span><b>→</b></button>}
        <button className="mode-button" type="button" onClick={onVsAi}><span className="mode-glyph">◆</span><span><b>{text.vsAi}</b><small>{text.vsAiLine}</small></span><strong>›</strong></button>
        <button className="mode-button" type="button" onClick={onLocal}><span className="mode-glyph ivory">◆</span><span><b>{text.local}</b><small>{text.localLine}</small></span><strong>›</strong></button>
        <button className="secondary-button" type="button" onClick={onRules}>{text.howTo}</button>
      </div>
    </section>
    <footer><a href="./privacy.html">{text.privacy}</a></footer>
  </main>
}

function SetupScreen({ difficulty, color, text, onDifficulty, onColor, onBack, onStart }: {
  difficulty: Difficulty; color: ColorChoice; text: AppText; onDifficulty: (value: Difficulty) => void; onColor: (value: ColorChoice) => void; onBack: () => void; onStart: () => void
}) {
  const options: Array<{ value: Difficulty; line: string }> = [
    { value: 'easy', line: text.easyLine }, { value: 'medium', line: text.mediumLine }, { value: 'hard', line: text.hardLine },
  ]
  return <main className="standard-screen">
    <TitleBar title={text.setup} onBack={onBack} text={text} />
    <section className="content-card setup-card">
      <SectionTitle>{text.difficulty}</SectionTitle>
      <div className="choice-stack">{options.map(({ value, line }, index) => <button key={value} className="choice-card" aria-pressed={difficulty === value} type="button" onClick={() => onDifficulty(value)}><i /><span><b>{text[value]}</b><small>{line}</small></span><em>{Array.from({ length: 3 }, (_, pip) => <u key={pip} className={pip <= index ? 'on' : ''} />)}</em></button>)}</div>
      <SectionTitle>{text.playAs}</SectionTitle>
      <div className="segmented">{(['red', 'ivory', 'random'] as ColorChoice[]).map((value) => <button key={value} className={value} type="button" aria-pressed={color === value} onClick={() => onColor(value)}>{text[value]}</button>)}</div>
      <p className="choice-caption">{color === 'ivory' ? text.ivoryGoal : text.redGoal}</p>
      <button className="primary-button wide" type="button" onClick={onStart}>{text.start}<b>→</b></button>
    </section>
  </main>
}

function PlayerCard({ player, name, active }: { player: Player; name: string; active: boolean }) {
  return <div className={`player-card ${player} ${active ? 'active' : ''}`}><i>{player === 'red' ? 'R' : 'I'}</i><span><b>{name}</b><small>{player.toUpperCase()}</small></span></div>
}

function MoveHistory({ moves, text, focused, onFocus, historyRef }: { moves: Move[]; text: AppText; focused: number | null; onFocus: (index: number | null) => void; historyRef: React.RefObject<HTMLDivElement | null> }) {
  return <div className="move-history"><strong>{text.moves}</strong><div ref={historyRef}>{moves.length === 0 ? <span>{text.noMoves}</span> : moves.map((move, index) => <button key={`${edgeKey(move)}-${index}`} className={move.player} aria-pressed={focused === index} type="button" onClick={() => onFocus(focused === index ? null : index)}><i />{String(index + 1).padStart(2, '0')} <b>{move.orientation === 'horizontal' ? '↔' : '↕'}</b> · {moveLabel(move)}</button>)}</div></div>
}

function ResultPanel({ winner, text, onAgain, onReview, onMenu }: { winner: Player; text: AppText; onAgain: () => void; onReview: () => void; onMenu: () => void }) {
  return <div className="result-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title"><section className={`result-card ${winner}`}><span className="result-mark">◆</span><p>{text.win}</p><h1 id="result-title">{winner === 'red' ? text.redWon : text.ivoryWon}</h1><button className="primary-button wide" type="button" onClick={onAgain}>{text.again}</button><button className="secondary-button wide" type="button" onClick={onReview}>{text.review}</button><button className="text-button" type="button" onClick={onMenu}>{text.menu}</button></section></div>
}

function ReviewScreen({ game, ply, text, settings, onPly, onBack }: { game: SavedGame; ply: number; text: AppText; settings: Settings; onPly: (ply: number) => void; onBack: () => void }) {
  const shown = game.moves.slice(0, ply)
  const winner = detectWinner(shown)
  return <main className="standard-screen review-screen">
    <TitleBar title={text.reviewTitle} onBack={onBack} text={text} />
    <section className="review-content">
      <p className="review-counter">{text.move} {ply} / {game.moves.length}{ply > 0 ? ` · ${moveLabel(game.moves[ply - 1])}` : ''}</p>
      <Board moves={shown} activePlayer={currentPlayer(shown)} selected={null} coordinates={settings.coordinates} hints={false} interactive={false} winningMoveIndexes={winner?.moveIndexes} focusedMoveIndex={ply > 0 ? ply - 1 : null} language={settings.language} onSlot={() => undefined} />
      <div className="review-controls"><button type="button" aria-label={text.first} onClick={() => onPly(0)} disabled={ply === 0}>|‹</button><button type="button" aria-label={text.previous} onClick={() => onPly(Math.max(0, ply - 1))} disabled={ply === 0}>‹</button><button type="button" aria-label={text.next} onClick={() => onPly(Math.min(game.moves.length, ply + 1))} disabled={ply === game.moves.length}>›</button><button type="button" aria-label={text.last} onClick={() => onPly(game.moves.length)} disabled={ply === game.moves.length}>›|</button></div>
    </section>
  </main>
}

function SettingsScreen({ settings, text, onChange, onBack }: { settings: Settings; text: AppText; onChange: (patch: Partial<Settings>) => void; onBack: () => void }) {
  return <main className="standard-screen"><TitleBar title={text.settings} onBack={onBack} text={text} /><section className="content-card settings-card">
    <SectionTitle>{text.gameplay}</SectionTitle><SettingsToggle title={text.coordinates} line={text.coordinatesLine} value={settings.coordinates} onChange={(coordinates) => onChange({ coordinates })} /><SettingsToggle title={text.hints} line={text.hintsLine} value={settings.hints} onChange={(hints) => onChange({ hints })} />
    <SectionTitle>{text.feedback}</SectionTitle><SettingsToggle title={text.sound} line={text.soundLine} value={settings.sound} onChange={(sound) => onChange({ sound })} />
    <SectionTitle>{text.accessibility}</SectionTitle><SettingsToggle title={text.reduceMotion} line={text.reduceMotionLine} value={settings.reduceMotion} onChange={(reduceMotion) => onChange({ reduceMotion })} />
    <SectionTitle>{text.language}</SectionTitle><div className="language-options"><button type="button" aria-pressed={settings.language === 'ru'} onClick={() => onChange({ language: 'ru' })}>{text.russian}</button><button type="button" aria-pressed={settings.language === 'en'} onClick={() => onChange({ language: 'en' })}>{text.english}</button></div>
    <a className="settings-link" href="./privacy.html">{text.privacy}<span>›</span></a>
  </section></main>
}

function SettingsToggle({ title, line, value, onChange }: { title: string; line: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="settings-row"><span><b>{title}</b><small>{line}</small></span><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>
}

function TitleBar({ title, onBack, text }: { title: string; onBack: () => void; text: AppText }) {
  return <header className="title-bar"><button className="icon-button" type="button" onClick={onBack} aria-label={text.back}>‹</button><h1>{title}</h1><span /></header>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

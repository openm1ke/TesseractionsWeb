import { useState } from 'react'
import { playStone, playWin } from '../game/audio'
import { detectWinner, edgeKey, type Move } from '../game/engine'
import type { Settings } from '../game/storage'
import type { Copy } from '../i18n/copy'
import { Board } from './Board'

interface TutorialScreenProps {
  text: Copy
  language: Settings['language']
  coordinates: boolean
  sound: boolean
  primaryLabel: string
  onBack: () => void
  onPrimary: () => void
  onDone: () => void
}

type LessonStep = 'goalRed' | 'goalIvory' | 'place' | 'confirm' | 'block' | 'win' | 'done'

const move = (player: Move['player'], orientation: Move['orientation'], column: number, row: number): Move => ({ player, orientation, column, row })
const red = (orientation: Move['orientation'], column: number, row: number) => move('red', orientation, column, row)
const ivory = (orientation: Move['orientation'], column: number, row: number) => move('ivory', orientation, column, row)

const PLACE_TARGET = red('vertical', 2, 2)
const HELD_SLOT = red('vertical', 1, 2)
const BLOCK_TARGET = red('vertical', 3, 2)
const WIN_TARGET = red('vertical', 2, 2)

const BLOCK_POSITION: Move[] = [
  red('vertical', 1, 0),
  ivory('horizontal', 1, 2),
  red('vertical', 1, 1),
  ivory('horizontal', 0, 2),
  red('vertical', 3, 0),
  ivory('horizontal', 2, 2),
  red('vertical', 3, 4),
  ivory('horizontal', 4, 2),
]

const WIN_POSITION: Move[] = [
  red('vertical', 2, 0),
  ivory('horizontal', 0, 1),
  red('vertical', 2, 1),
  ivory('horizontal', 0, 3),
  red('vertical', 2, 3),
  ivory('horizontal', 4, 1),
  red('vertical', 2, 4),
  ivory('horizontal', 4, 3),
]

const WON_POSITION = [...WIN_POSITION, WIN_TARGET]

const lessonNumber: Record<LessonStep, number | null> = {
  goalRed: 1,
  goalIvory: 1,
  place: 2,
  confirm: 3,
  block: 4,
  win: 5,
  done: null,
}

export function TutorialScreen({ text, language, coordinates, sound, primaryLabel, onBack, onPrimary, onDone }: TutorialScreenProps) {
  const [step, setStep] = useState<LessonStep>('goalRed')
  const [moves, setMoves] = useState<Move[]>([])
  const [selected, setSelected] = useState<Move | null>(null)
  const [succeeded, setSucceeded] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const lesson = lessonNumber[step]
  const winning = detectWinner(moves)
  const boardActive = !succeeded && ['place', 'confirm', 'block', 'win'].includes(step)

  const title = step === 'goalRed' || step === 'goalIvory'
    ? text.lessonGoalTitle
    : step === 'place'
      ? text.lessonPlaceTitle
      : step === 'confirm'
        ? text.lessonConfirmTitle
        : step === 'block'
          ? text.lessonBlockTitle
          : step === 'win'
            ? text.lessonWinTitle
            : text.lessonDoneTitle

  const lines = step === 'goalRed'
    ? [text.lessonGoalRed]
    : step === 'goalIvory'
      ? [text.lessonGoalIvory, text.lessonGoalRace]
      : step === 'place'
        ? [text.lessonPlaceBody]
        : step === 'confirm'
          ? [succeeded ? text.lessonConfirmDone : text.lessonConfirmBody]
          : step === 'block'
            ? [succeeded ? text.lessonBlockDone : text.lessonBlockBody]
            : step === 'win'
              ? [succeeded ? text.lessonWinDone : text.lessonWinBody]
              : [text.lessonDoneBody]

  const emphasisRails = succeeded
    ? []
    : step === 'goalRed' || step === 'win'
      ? ['red' as const]
      : step === 'goalIvory' || step === 'block'
        ? ['ivory' as const]
        : []
  const emphasisMoves = succeeded
    ? []
    : step === 'place'
      ? [PLACE_TARGET]
      : step === 'confirm' && selected
        ? [selected]
        : step === 'block'
          ? [BLOCK_TARGET]
          : step === 'win'
            ? [WIN_TARGET]
            : []

  const goTo = (next: LessonStep) => {
    setStep(next)
    setSucceeded(false)
    setFeedback(null)
    setSelected(null)
    if (next === 'block') setMoves(BLOCK_POSITION)
    else if (next === 'win') setMoves(WIN_POSITION)
    else if (next === 'done') setMoves(step === 'win' && succeeded ? moves : WON_POSITION)
    else if (next !== 'confirm') setMoves([])
  }

  const next = () => {
    const order: LessonStep[] = ['goalRed', 'goalIvory', 'place', 'confirm', 'block', 'win', 'done']
    goTo(order[order.indexOf(step) + 1])
  }

  const choose = (candidate: Move) => {
    if (!boardActive) return
    if (step === 'place') {
      setSelected(candidate)
      setFeedback(null)
      setStep('confirm')
      return
    }
    if (step === 'confirm') {
      if (!selected || edgeKey(selected) !== edgeKey(candidate)) {
        setSelected(candidate)
        setFeedback(null)
        return
      }
      setMoves([...moves, candidate])
      setSelected(null)
      setSucceeded(true)
      setFeedback(null)
      playStone('red', sound)
      return
    }
    if (step === 'block') {
      if (edgeKey(candidate) === edgeKey(HELD_SLOT)) {
        setSelected(null)
        setFeedback(text.lessonHeldByIvory)
        return
      }
      if (edgeKey(candidate) !== edgeKey(BLOCK_TARGET)) {
        setSelected(null)
        setFeedback(text.lessonBlockNudge)
        return
      }
    }
    if (step === 'win' && edgeKey(candidate) !== edgeKey(WIN_TARGET)) {
      setSelected(null)
      setFeedback(text.lessonWinNudge)
      return
    }
    if (!selected || edgeKey(selected) !== edgeKey(candidate)) {
      setSelected(candidate)
      setFeedback(null)
      return
    }
    const nextMoves = [...moves, candidate]
    setMoves(nextMoves)
    setSelected(null)
    setSucceeded(true)
    setFeedback(null)
    playStone('red', sound)
    if (step === 'win') playWin(sound)
  }

  const canContinue = step === 'goalRed' || step === 'goalIvory' || succeeded

  return <main className="tutorial-screen android-tutorial">
    <header className="tutorial-topbar">
      <button className="icon-button" type="button" onClick={onBack} aria-label={text.back}>‹</button>
      <h1>{text.tutorialTitle}</h1>
      <span />
    </header>
    <section className="tutorial-lesson">
      <div className="tutorial-visual">
        <div className="tutorial-board android-board">
          <Board
            moves={moves}
            activePlayer="red"
            selected={selected}
            coordinates={coordinates}
            hints={false}
            interactive={boardActive}
            winningMoveIndexes={winning?.moveIndexes}
            language={language}
            onSlot={choose}
            extraMoves={step === 'block' ? [HELD_SLOT] : []}
            emphasisRails={emphasisRails}
            emphasisMoves={emphasisMoves}
          />
        </div>
      </div>
      <div className="tutorial-copy android-copy">
        {lesson && <div className="android-progress"><span>{text.lessonProgress.replace('{lesson}', String(lesson)).replace('{count}', '5')}</span><div aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < lesson ? 'active' : ''} />)}</div></div>}
        <h2>{title}</h2>
        {lines.map((line) => <p key={line}>{line}</p>)}
        {feedback && <strong className="lesson-feedback" aria-live="polite">{feedback}</strong>}
      </div>
    </section>
    {step === 'done'
      ? <div className="tutorial-done-actions"><button className="primary-button wide" type="button" onClick={onPrimary}>{primaryLabel}</button><button className="text-button wide" type="button" onClick={onDone}>{text.lessonDone}</button></div>
      : <nav className="android-tutorial-actions" aria-label={text.tutorialTitle}><button className="text-button" type="button" onClick={() => goTo('done')}>{text.lessonSkip}</button>{canContinue && <button className="primary-button" type="button" onClick={next}>{text.lessonNext}</button>}</nav>}
  </main>
}

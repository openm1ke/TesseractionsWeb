import { useEffect, useState } from 'react'
import { Board } from './Board'
import type { Move } from '../game/engine'
import type { Settings } from '../game/storage'
import type { Copy } from '../i18n/copy'

interface TutorialScreenProps {
  text: Copy
  language: Settings['language']
  coordinates: boolean
  onBack: () => void
  onDone: () => void
}

type LessonKind = 'goal' | 'place' | 'block' | 'win' | 'ready'

export function TutorialScreen({ text, language, coordinates, onBack, onDone }: TutorialScreenProps) {
  const [index, setIndex] = useState(0)
  const [placementStage, setPlacementStage] = useState(0)
  const lessons: Array<{ kind: LessonKind; title: string; body: string }> = [
    { kind: 'goal', title: text.tutorialGoalTitle, body: text.tutorialGoalBody },
    { kind: 'place', title: text.tutorialPlaceTitle, body: text.tutorialPlaceBody },
    { kind: 'block', title: text.tutorialBlockTitle, body: text.tutorialBlockBody },
    { kind: 'win', title: text.tutorialWinTitle, body: text.tutorialWinBody },
    { kind: 'ready', title: text.tutorialReadyTitle, body: text.tutorialReadyBody },
  ]
  const lesson = lessons[index]

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && index > 0) setIndex(index - 1)
      if (event.key === 'ArrowRight') {
        if (index < lessons.length - 1) setIndex(index + 1)
        else onDone()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, lessons.length, onDone])

  const goPrevious = () => {
    if (index === 0) return
    setIndex(index - 1)
    setPlacementStage(0)
  }
  const goNext = () => {
    if (index === lessons.length - 1) {
      onDone()
      return
    }
    setIndex(index + 1)
    setPlacementStage(0)
  }

  return <main className="tutorial-screen">
    <header className="tutorial-topbar">
      <button className="icon-button" type="button" onClick={onBack} aria-label={text.back}>‹</button>
      <h1>{text.tutorialTitle}</h1>
      <span className="tutorial-counter" aria-live="polite">{index + 1}/{lessons.length}</span>
    </header>
    <section className="tutorial-lesson">
      <div className="tutorial-visual">
        <TutorialVisual kind={lesson.kind} placementStage={placementStage} onPlace={() => setPlacementStage((stage) => Math.min(stage + 1, 2))} text={text} language={language} coordinates={coordinates} />
      </div>
      <div className="tutorial-copy">
        <span>{text.tutorialEyebrow}</span>
        <h2>{lesson.title}</h2>
        <p>{lesson.body}</p>
      </div>
    </section>
    <nav className="tutorial-controls" aria-label={text.tutorialTitle}>
      <button type="button" onClick={goPrevious} disabled={index === 0}>{text.back}</button>
      <div aria-hidden="true">{lessons.map((_, lessonIndex) => <i key={lessonIndex} className={lessonIndex === index ? 'active' : ''} />)}</div>
      <button className="next" type="button" onClick={goNext}>{index === lessons.length - 1 ? text.tutorialDone : text.tutorialNext}</button>
    </nav>
  </main>
}

function TutorialVisual({ kind, placementStage, onPlace, text, language, coordinates }: {
  kind: LessonKind
  placementStage: number
  onPlace: () => void
  text: Copy
  language: Settings['language']
  coordinates: boolean
}) {
  if (kind === 'goal') {
    return <div className="tutorial-board tutorial-goal-board">
      <Board moves={[]} activePlayer="red" selected={null} coordinates={coordinates} hints={false} interactive={false} language={language} onSlot={() => undefined} />
      <span className="goal-arrow red">↓</span><span className="goal-arrow ivory">→</span>
    </div>
  }
  if (kind === 'place') {
    const tip = placementStage === 0 ? text.tutorialTapOnce : placementStage === 1 ? text.tutorialTapAgain : text.tutorialPlaced
    return <div className={`placement-demo stage-${placementStage}`}>
      <div className="demo-rail" />
      <span className="demo-node top" /><span className="demo-node bottom" />
      {placementStage > 0 && <span className="demo-stripe" />}
      {placementStage > 0 && <span className="demo-token" />}
      <button type="button" aria-label={tip} onClick={onPlace}><i /></button>
      <strong aria-live="polite">{tip}</strong>
    </div>
  }
  if (kind === 'block') {
    return <div className="block-demo">
      <span className="block-line ivory" /><span className="block-line red" />
      <span className="block-node top" /><span className="block-node bottom" /><span className="block-node left" /><span className="block-node right" />
      <span className="block-token" /><span className="blocked-mark">×</span>
    </div>
  }
  if (kind === 'win') {
    const winningMoves: Move[] = Array.from({ length: 5 }, (_, row) => ({ player: 'red', column: 2, row, orientation: 'vertical' }))
    return <div className="tutorial-board">
      <Board moves={winningMoves} activePlayer="ivory" selected={null} coordinates={coordinates} hints={false} interactive={false} winningMoveIndexes={[0, 1, 2, 3, 4]} language={language} onSlot={() => undefined} />
    </div>
  }
  return <div className="ready-demo">
    <div className="ready-player ivory"><i>I</i><span>IVORY</span></div>
    <div className="ready-turn"><span>◆</span><strong>{text.tutorialRedStarts}</strong></div>
    <div className="ready-player red"><i>R</i><span>RED</span></div>
  </div>
}

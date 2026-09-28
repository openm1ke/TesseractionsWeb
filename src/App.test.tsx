import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('application shell', () => {
  beforeEach(() => localStorage.clear())

  it('shows both offline game modes and the privacy link', () => {
    render(<App />)
    expect(screen.getByText('TESSERACTIONS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ПРОТИВ ИИ|VS AI/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ЛОКАЛЬНЫЙ МАТЧ|LOCAL MATCH/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Политика конфиденциальности|Privacy policy/ })).toHaveAttribute('href', './privacy.html')
  })

  it('shows the step-by-step tutorial before the first match', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /ПРОТИВ ИИ|VS AI/ }))
    expect(screen.getByRole('heading', { name: /КАК ИГРАТЬ|HOW TO PLAY/ })).toBeInTheDocument()

    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: /ДАЛЕЕ|NEXT/ }))
    }
    fireEvent.click(screen.getByRole('button', { name: /ПРОДОЛЖИТЬ|CONTINUE/ }))

    expect(screen.getByRole('heading', { name: /ИГРА ПРОТИВ ИИ|PLAY VS AI/ })).toBeInTheDocument()
  })
})

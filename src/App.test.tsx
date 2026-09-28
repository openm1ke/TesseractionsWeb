import { render, screen } from '@testing-library/react'
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
})

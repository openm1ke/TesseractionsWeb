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
    localStorage.setItem('tesseractions.settings.v1', JSON.stringify({ language: 'ru', sound: false }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /ПРОТИВ ИИ/ }))
    expect(screen.getByRole('heading', { name: 'КАК ИГРАТЬ' })).toBeInTheDocument()
    expect(screen.getByText('УРОК 1 ИЗ 5')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ДАЛЕЕ' }))
    expect(screen.getByText('БЕЛЫЙ строит путь СЛЕВА НАПРАВО.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'ДАЛЕЕ' }))

    const place = screen.getByRole('button', { name: 'C3, красных, вертикально' })
    fireEvent.click(place)
    expect(screen.getByRole('heading', { name: 'Подтвердите' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'C3, красных, вертикально' }))
    expect(screen.getByText('Готово.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'ДАЛЕЕ' }))

    fireEvent.click(screen.getByRole('button', { name: 'B3, красных, вертикально' }))
    expect(screen.getByText('ЗАНЯТО БЕЛЫМ')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'D3, красных, вертикально' }))
    fireEvent.click(screen.getByRole('button', { name: 'D3, красных, вертикально' }))
    expect(screen.getByText('Перекрыто. БЕЛЫЙ здесь больше не пройдёт.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'ДАЛЕЕ' }))

    fireEvent.click(screen.getByRole('button', { name: 'C3, красных, вертикально' }))
    fireEvent.click(screen.getByRole('button', { name: 'C3, красных, вертикально' }))
    expect(screen.getByText('Вы построили путь СВЕРХУ ВНИЗ.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'ДАЛЕЕ' }))

    expect(screen.getByRole('heading', { name: 'Вы готовы.' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'ИГРАТЬ ПРОТИВ ИИ' }))
    expect(screen.getByRole('heading', { name: 'ИГРА ПРОТИВ ИИ' })).toBeInTheDocument()
  })
})

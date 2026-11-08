import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import './i18n'
import i18n from './i18n'
import App from './App'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); void i18n.changeLanguage('en') })

test('shows successful database connection and switches language', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) }))
  render(<App />)
  expect(await screen.findByText('API and database connected')).toBeInTheDocument()
  fireEvent.mouseDown(screen.getByRole('combobox'))
  fireEvent.click(screen.getByRole('option', { name: 'Қазақша' }))
  expect(await screen.findByText('API мен дерекқор қосылған')).toBeInTheDocument()
  expect(document.documentElement.lang).toBe('kk')
})

test('shows an unavailable state and allows retry', async () => {
  const request = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'ok' }) })
  vi.stubGlobal('fetch', request)
  render(<App />)
  expect(await screen.findByText('API or database unavailable')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Check again' }))
  expect(await screen.findByText('API and database connected')).toBeInTheDocument()
})

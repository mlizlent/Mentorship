import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DesignPage from '@/pages/DesignPage'

describe('DesignPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<DesignPage />)
    expect(container).toBeDefined()
  })

  it('renders the system design heading', () => {
    render(<DesignPage />)
    const headings = screen.getAllByRole('heading', { name: /System Design/ })
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders the Architecture tab', () => {
    render(<DesignPage />)
    const buttons = screen.getAllByRole('button', { name: 'Architecture' })
    expect(buttons.length).toBeGreaterThan(0)
  })
})

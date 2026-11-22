import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SafeChatTips } from '@/components/ui/safe-chat-tips'

describe('SafeChatTips', () => {
  it('renders safe chatting tips', () => {
    render(<SafeChatTips />)
    expect(screen.getByText('Safe chatting tips')).not.toBeNull()
    expect(screen.getByText(/Never share phone numbers, emails, or addresses\./)).not.toBeNull()
    expect(screen.getByText(/Keep all conversations on the platform\./)).not.toBeNull()
    expect(screen.getByText(/Report any message that makes you uncomfortable\./)).not.toBeNull()
    expect(screen.getByText(/Guardians of under-18 mentees can view these chats\./)).not.toBeNull()
  })
})

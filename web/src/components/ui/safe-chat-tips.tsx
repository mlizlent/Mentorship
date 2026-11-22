import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SafeChatTipsProps {
  className?: string
}

export const SafeChatTips = React.forwardRef<HTMLDivElement, SafeChatTipsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-3 rounded-lg border border-warning bg-warning/10 p-3 text-warning text-sm',
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 mt-0.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12.01" y2="12" />
        <path d="M5 13l4 4 7-7" />
      </svg>
      <div>
        <p className="font-semibold mb-1">Safe chatting tips</p>
        <ul className="list-disc list-inside space-y-1 text-warning">
          <li>Never share phone numbers, emails, or addresses.</li>
          <li>Keep all conversations on the platform.</li>
          <li>Report any message that makes you uncomfortable.</li>
          <li>Guardians of under-18 mentees can view these chats.</li>
        </ul>
      </div>
    </div>
  ),
)
SafeChatTips.displayName = 'SafeChatTips'

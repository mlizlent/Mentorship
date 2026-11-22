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

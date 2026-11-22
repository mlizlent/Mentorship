import { cn } from '@/lib/utils'

export interface InitialsAvatarProps {
  initials: string
  accent?: string
  className?: string
}

export function InitialsAvatar({
  initials,
  accent,
  className,
}: InitialsAvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center font-extrabold shadow-sm',
        accent ?? 'bg-primary-container text-on-primary',
        className,
      )}
    >
      {initials}
    </div>
  )
}
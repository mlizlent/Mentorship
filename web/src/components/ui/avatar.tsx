import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLImageElement> {
  src: string
  alt?: string
  className?: string
}

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, src, alt, ...props }, ref) => (
    <img
      ref={ref}
      src={src}
      alt={alt ?? 'User avatar'}
      className={cn(
        'h-10 w-10 rounded-full object-cover border border-outline-variant bg-surface-container-low',
        className
      )}
      {...props}
    />
  ),
)
Avatar.displayName = 'Avatar'

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <h3 className="text-lg font-medium text-ink">{title}</h3>
    {description && <p className="mt-1 text-neutral-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

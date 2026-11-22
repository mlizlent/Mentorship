import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="mb-4 flex items-start">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={cn(
            'h-4 w-4 shrink-0 rounded border-neutral-300 bg-white text-primary-600 focus:ring-primary-600 focus:ring-2 focus:ring-offset-1',
            error && 'border-danger',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="ml-2 text-sm text-ink"
          >
            {label}
          </label>
        )}
        {error && (
          <p className="ml-6 mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    )
  },
)
Checkbox.displayName = 'Checkbox'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  className?: string
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  className?: string
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

interface TabsContentProps {
  className?: string
  value: string
  children: React.ReactNode
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({ className, value, onValueChange, children }, ref) => (
  <div ref={ref} className={cn(className)}>
    {React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return null
      return React.cloneElement(child as React.ReactElement, { value, onValueChange })
    })}
  </div>
))
Tabs.displayName = 'Tabs'

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className, children }, ref) => (
  <div ref={ref} className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-neutral-100 p-1', className)}>
    {children}
  </div>
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(({ className, value, onValueChange, children }, ref) => (
  <button
    ref={ref}
    onClick={() => onValueChange(value)}
    className={cn(
      'rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
      value === 'active' ? 'bg-white shadow-sm text-ink' : 'text-neutral-600 hover:text-neutral-900',
      className
    )}
  >
    {children}
  </button>
))
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(({ className, value, children }, ref) => (
  <div ref={ref} className={cn('mt-2', className)} hidden={value !== 'active'}>
    {children}
  </div>
))
TabsContent.displayName = 'TabsContent'

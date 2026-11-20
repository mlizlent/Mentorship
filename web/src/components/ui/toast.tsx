import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  info: 'bg-primary-600 text-white',
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={cn(
          'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md shadow-lg text-sm',
          typeStyles[toast.type]
        )}
      >
        <span>{toast.message}</span>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-auto opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
)

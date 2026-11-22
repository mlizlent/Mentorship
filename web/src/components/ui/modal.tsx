import * as React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg m-4 bg-surface-container-low rounded-lg shadow-xl">
        {title && (
          <div className="px-6 py-4 border-b border-outline-variant">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
          </div>
        )}
        <div className="p-6">{children}</div>
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium text-on-surface-variant bg-surface-container-low rounded-md hover:bg-surface-container-high"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

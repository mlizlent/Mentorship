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
      <div className="relative w-full max-w-lg m-4 bg-white rounded-lg shadow-xl">
        {title && (
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
          </div>
        )}
        <div className="p-6">{children}</div>
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

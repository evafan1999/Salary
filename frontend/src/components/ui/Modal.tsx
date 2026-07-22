import type { ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-xl bg-white p-4 dark:bg-gray-800 md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-sm text-gray-500">
            關閉
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

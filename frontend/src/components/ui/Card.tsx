import type { ReactNode } from 'react'

export function Card({
  title,
  actions,
  children,
}: {
  title?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

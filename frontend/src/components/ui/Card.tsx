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
    <div className="rounded-xl border border-wisteria/30 bg-white p-4 shadow-sm dark:border-dusk dark:bg-gray-800">
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="text-sm font-semibold text-dusk dark:text-wisteria">{title}</h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

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
    <div>
      {(title || actions) && (
        <div className="mb-2 flex items-center justify-between px-1">
          {title && (
            <h2 className="text-sm font-semibold text-dusk dark:text-wisteria">{title}</h2>
          )}
          {actions}
        </div>
      )}
      <div className="rounded-xl bg-white p-4 dark:bg-gray-800/60">{children}</div>
    </div>
  )
}

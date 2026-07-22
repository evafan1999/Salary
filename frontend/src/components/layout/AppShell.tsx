import type { ReactNode } from 'react'
import { BottomTabBar } from './BottomTabBar'
import { SideNav } from './SideNav'
import { CurrencySelector } from '../CurrencySelector'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-gray-50 dark:bg-gray-900">
      <SideNav />
      <div className="flex-1 pb-16 md:pb-0">
        <div className="flex justify-end px-4 pt-3">
          <CurrencySelector />
        </div>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </div>
      <BottomTabBar />
    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { getStoredToken, setStoredToken, UNAUTHORIZED_EVENT } from '../lib/apiClient'

export function AccessCodeGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => getStoredToken())
  const [input, setInput] = useState('')

  useEffect(() => {
    const handleUnauthorized = () => setToken(null)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  if (token) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <form
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        onSubmit={(e) => {
          e.preventDefault()
          if (!input.trim()) return
          setStoredToken(input.trim())
          setToken(input.trim())
        }}
      >
        <h1 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          輸入存取碼
        </h1>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          placeholder="Access code"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          進入
        </button>
      </form>
    </div>
  )
}

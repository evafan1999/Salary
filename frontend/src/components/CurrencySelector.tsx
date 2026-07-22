import { useEffect, useRef, useState } from 'react'
import { useCurrency } from '../contexts/CurrencyContext'
import { SUPPORTED_CURRENCIES } from '../lib/currency'

const CURRENCY_FLAGS: Record<string, string> = {
  AUD: '🇦🇺',
  TWD: '🇹🇼',
  USD: '🇺🇸',
  JPY: '🇯🇵',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  NZD: '🇳🇿',
  HKD: '🇭🇰',
  CNY: '🇨🇳',
  SGD: '🇸🇬',
}

const symbolCache = new Map<string, string>()
function getCurrencySymbol(code: string): string {
  let symbol = symbolCache.get(code)
  if (!symbol) {
    const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).formatToParts(0)
    symbol = parts.find((p) => p.type === 'currency')?.value ?? code
    symbolCache.set(code, symbol)
  }
  return symbol
}

export function CurrencySelector() {
  const { currency, setCurrency, hasError, isLoading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex items-center gap-2" ref={containerRef}>
      {hasError && <span className="text-xs text-red-500">匯率載入失敗,顯示澳幣</span>}
      {!hasError && isLoading && currency !== 'AUD' && (
        <span className="text-xs text-gray-400">匯率載入中...</span>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-wisteria/30 bg-white px-3 py-1.5 text-xs text-dusk shadow-sm hover:bg-wisteria/10 dark:border-dusk dark:bg-gray-800 dark:text-wisteria dark:hover:bg-gray-700"
      >
        <span>{CURRENCY_FLAGS[currency] ?? '🏳️'}</span>
        {getCurrencySymbol(currency) !== currency && (
          <span className="font-semibold">{getCurrencySymbol(currency)}</span>
        )}
        <span>{currency}</span>
        <span className="text-gray-400">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-wisteria/30 bg-white py-1 shadow-lg dark:border-dusk dark:bg-gray-800">
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-wisteria/10 dark:hover:bg-gray-700 ${
                c.code === currency ? 'bg-wisteria/15 dark:bg-glaucous/20' : ''
              }`}
            >
              <span>{CURRENCY_FLAGS[c.code] ?? '🏳️'}</span>
              <span className="w-8 font-semibold">
                {getCurrencySymbol(c.code) !== c.code ? getCurrencySymbol(c.code) : ''}
              </span>
              <span className="font-medium">{c.code}</span>
              <span className="text-gray-400">{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { BASE_CURRENCY, CURRENCY_STORAGE_KEY } from '../lib/currency'

interface CurrencyContextValue {
  currency: string
  setCurrency: (code: string) => void
  format: (audAmount: string | number | null | undefined) => string
  isLoading: boolean
  hasError: boolean
  lastUpdated: string | null
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

const formatterCache = new Map<string, Intl.NumberFormat>()
function getFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatterCache.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency })
    formatterCache.set(currency, formatter)
  }
  return formatter
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem(CURRENCY_STORAGE_KEY) ?? BASE_CURRENCY,
  )
  const { data, isLoading, isError } = useExchangeRates()

  const setCurrency = (code: string) => {
    setCurrencyState(code)
    localStorage.setItem(CURRENCY_STORAGE_KEY, code)
  }

  // If the live rate fetch fails, fall back to showing the underlying AUD
  // amount rather than displaying a wrong-looking number under a currency
  // symbol we couldn't actually convert to.
  const effectiveCurrency = isError ? BASE_CURRENCY : currency
  const rate = effectiveCurrency === BASE_CURRENCY ? 1 : data?.rates[effectiveCurrency]

  const format = (audAmount: string | number | null | undefined): string => {
    const audNumber = Number(audAmount ?? 0)
    if (effectiveCurrency !== BASE_CURRENCY && rate === undefined) {
      // Rates for a non-AUD target haven't loaded yet — show AUD as a safe placeholder.
      return getFormatter(BASE_CURRENCY).format(audNumber)
    }
    return getFormatter(effectiveCurrency).format(audNumber * (rate ?? 1))
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        format,
        isLoading,
        hasError: isError,
        lastUpdated: data?.updatedAt ?? null,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return ctx
}

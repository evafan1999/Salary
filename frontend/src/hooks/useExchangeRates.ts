import { useQuery } from '@tanstack/react-query'
import { BASE_CURRENCY } from '../lib/currency'

interface ExchangeRatesResponse {
  result: string
  base_code: string
  rates: Record<string, number>
  time_last_update_utc: string
}

export interface ExchangeRates {
  base: string
  rates: Record<string, number>
  updatedAt: string
}

async function fetchExchangeRates(): Promise<ExchangeRates> {
  const response = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`)
  if (!response.ok) {
    throw new Error(`Exchange rate API error ${response.status}`)
  }
  const data = (await response.json()) as ExchangeRatesResponse
  if (data.result !== 'success') {
    throw new Error('Exchange rate API returned a non-success result')
  }
  return { base: data.base_code, rates: data.rates, updatedAt: data.time_last_update_utc }
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates', BASE_CURRENCY],
    queryFn: fetchExchangeRates,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  })
}

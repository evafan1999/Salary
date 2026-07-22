export const BASE_CURRENCY = 'AUD'
export const CURRENCY_STORAGE_KEY = 'salary-tracker-display-currency'

export const SUPPORTED_CURRENCIES = [
  { code: 'AUD', label: '澳幣' },
  { code: 'TWD', label: '台幣' },
  { code: 'USD', label: '美金' },
  { code: 'JPY', label: '日圓' },
  { code: 'EUR', label: '歐元' },
  { code: 'GBP', label: '英鎊' },
  { code: 'NZD', label: '紐幣' },
  { code: 'HKD', label: '港幣' },
  { code: 'CNY', label: '人民幣' },
  { code: 'SGD', label: '新加坡幣' },
] as const

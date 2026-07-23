import { useState } from 'react'
import { RentSection } from '../Rent/RentSection'
import { LoanSection } from '../CarLoan/LoanSection'
import { DailyExpenseSection } from './DailyExpenseSection'

type ExpenseTab = 'rent' | 'loan' | 'daily'

const TABS: { key: ExpenseTab; label: string }[] = [
  { key: 'rent', label: '房租' },
  { key: 'loan', label: '貸款' },
  { key: 'daily', label: '日常開銷' },
]

export function ExpensesPage() {
  const [tab, setTab] = useState<ExpenseTab>('rent')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">支出</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1 text-sm ${
              tab === t.key ? 'bg-glaucous text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rent' && <RentSection />}
      {tab === 'loan' && <LoanSection />}
      {tab === 'daily' && <DailyExpenseSection />}
    </div>
  )
}

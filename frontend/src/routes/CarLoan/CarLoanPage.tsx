import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import {
  useCarLoanPayments,
  useCarLoans,
  useCreateCarLoan,
  useCreateCarLoanPayment,
} from '../../hooks/useCarLoan'
import { formatMoney } from '../../lib/formatMoney'
import type { CarLoanCreate, CarLoanPaymentCreate } from '../../types/api'

export function CarLoanPage() {
  const { data: loans } = useCarLoans()
  const createLoan = useCreateCarLoan()
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)

  const loanForm = useForm<CarLoanCreate>()
  const paymentForm = useForm<CarLoanPaymentCreate>()
  const createPayment = useCreateCarLoanPayment(selectedLoanId ?? 0)
  const { data: payments } = useCarLoanPayments(selectedLoanId ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">車貸</h1>

      <Card title="車貸列表">
        <div className="flex flex-col gap-2">
          {loans?.map((loan) => (
            <button
              key={loan.id}
              onClick={() => setSelectedLoanId(loan.id === selectedLoanId ? null : loan.id)}
              className={`rounded-md border p-2 text-left text-sm ${
                selectedLoanId === loan.id
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="font-medium">{loan.description}</p>
              <p className="text-xs text-gray-500">
                總額 ${formatMoney(loan.total_amount)} · 已還 ${formatMoney(loan.paid_to_date)} · 剩餘 $
                {formatMoney(loan.remaining_balance)}
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card title="新增車貸">
        <form
          className="flex flex-col gap-3"
          onSubmit={loanForm.handleSubmit((values) =>
            createLoan.mutate(values, { onSuccess: () => loanForm.reset() }),
          )}
        >
          <input
            {...loanForm.register('description', { required: true })}
            placeholder="車輛描述"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <input
            {...loanForm.register('total_amount', { required: true })}
            placeholder="總金額"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <input
            type="date"
            {...loanForm.register('start_date', { required: true })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <Button type="submit" disabled={createLoan.isPending}>
            新增車貸
          </Button>
        </form>
      </Card>

      {selectedLoanId && (
        <Card title="還款紀錄">
          <div className="mb-3 flex flex-col gap-2">
            {payments?.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.payment_date}</span>
                <span>${formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={paymentForm.handleSubmit((values) =>
              createPayment.mutate(values, { onSuccess: () => paymentForm.reset() }),
            )}
          >
            <input
              type="date"
              {...paymentForm.register('payment_date', { required: true })}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              {...paymentForm.register('amount', { required: true })}
              placeholder="金額"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <Button type="submit" disabled={createPayment.isPending}>
              新增
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import {
  useCarLoanPayments,
  useCarLoans,
  useCreateCarLoan,
  useCreateCarLoanPayment,
  useUpdateCarLoan,
} from '../../hooks/useCarLoan'
import { useCurrency } from '../../contexts/CurrencyContext'
import type { CarLoanCreate, CarLoanPaymentCreate, CarLoanUpdate } from '../../types/api'

export function CarLoanPage() {
  const { data: loans } = useCarLoans()
  const createLoan = useCreateCarLoan()
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [showEdit, setShowEdit] = useState(false)

  const loanForm = useForm<CarLoanCreate>()
  const paymentForm = useForm<CarLoanPaymentCreate>()
  const createPayment = useCreateCarLoanPayment(selectedLoanId ?? 0)
  const updateLoan = useUpdateCarLoan(selectedLoanId ?? 0)
  const { data: payments } = useCarLoanPayments(selectedLoanId ?? 0)
  const { format } = useCurrency()

  const selectedLoan = loans?.find((loan) => loan.id === selectedLoanId) ?? null
  const editForm = useForm<CarLoanUpdate>({ defaultValues: selectedLoan ?? {} })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">車貸</h1>

      <Card title="車貸列表">
        <div className="flex flex-col">
          {loans?.map((loan) => (
            <button
              key={loan.id}
              onClick={() => setSelectedLoanId(loan.id === selectedLoanId ? null : loan.id)}
              className={`border-b border-gray-100 px-2 py-3 text-left text-sm last:border-b-0 dark:border-gray-700/50 ${
                selectedLoanId === loan.id ? 'bg-wisteria/15 dark:bg-glaucous/20' : ''
              }`}
            >
              <p className="font-medium">{loan.description}</p>
              <p className="text-xs text-gray-500">
                總額 {format(loan.total_amount)} · 已還 {format(loan.paid_to_date)} · 剩餘{' '}
                {format(loan.remaining_balance)}
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

      {selectedLoan && (
        <Card
          title="還款紀錄"
          actions={
            <button
              onClick={() => {
                editForm.reset(selectedLoan)
                setShowEdit(true)
              }}
              aria-label="編輯車貸"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✏️
            </button>
          }
        >
          <div className="mb-3 flex flex-col gap-2">
            {payments?.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.payment_date}</span>
                <span>{format(p.amount)}</span>
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

      {showEdit && selectedLoan && (
        <Modal title="編輯車貸" onClose={() => setShowEdit(false)}>
          <form
            className="flex flex-col gap-3"
            onSubmit={editForm.handleSubmit((values) =>
              updateLoan.mutate(values, { onSuccess: () => setShowEdit(false) }),
            )}
          >
            <div>
              <label className="mb-1 block text-xs text-gray-500">車輛描述</label>
              <input
                {...editForm.register('description', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">總金額</label>
              <input
                {...editForm.register('total_amount', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">開始日期</label>
              <input
                type="date"
                {...editForm.register('start_date', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <Button type="submit" disabled={updateLoan.isPending}>
              儲存變更
            </Button>
          </form>
        </Modal>
      )}
    </div>
  )
}

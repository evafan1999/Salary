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
  useUpdateCarLoanPayment,
} from '../../hooks/useCarLoan'
import { useCurrency } from '../../contexts/CurrencyContext'
import type {
  CarLoan,
  CarLoanCreate,
  CarLoanPayment,
  CarLoanPaymentCreate,
  CarLoanPaymentUpdate,
  CarLoanUpdate,
} from '../../types/api'

const VISIBLE_PAYMENTS_DEFAULT = 5

function PaymentsList({ payments, loanId }: { payments: CarLoanPayment[]; loanId: number }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? payments : payments.slice(0, VISIBLE_PAYMENTS_DEFAULT)

  return (
    <div className="mb-3 flex flex-col gap-2">
      {payments.length === 0 && <p className="text-sm text-gray-500">尚無還款紀錄</p>}
      {visible.map((p) => (
        <PaymentRow key={p.id} payment={p} loanId={loanId} />
      ))}
      {payments.length > VISIBLE_PAYMENTS_DEFAULT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="self-start text-xs text-glaucous dark:text-wisteria"
        >
          {showAll ? '收起 ▲' : `顯示更多(共 ${payments.length} 筆) ▼`}
        </button>
      )}
    </div>
  )
}

function PaymentRow({ payment, loanId }: { payment: CarLoanPayment; loanId: number }) {
  const [isEditing, setIsEditing] = useState(false)
  const updatePayment = useUpdateCarLoanPayment(loanId, payment.id)
  const { register, handleSubmit, reset } = useForm<CarLoanPaymentUpdate>({
    defaultValues: { payment_date: payment.payment_date, amount: payment.amount },
  })
  const { format } = useCurrency()

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span>{payment.payment_date}</span>
        <div className="flex items-center gap-2">
          <span>{format(payment.amount)}</span>
          <button
            onClick={() => {
              reset({ payment_date: payment.payment_date, amount: payment.amount })
              setIsEditing(true)
            }}
            aria-label="編輯還款紀錄"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✏️
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={handleSubmit((values) =>
        updatePayment.mutate(values, { onSuccess: () => setIsEditing(false) }),
      )}
    >
      <input
        type="date"
        {...register('payment_date', { required: true })}
        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm sm:flex-1 dark:border-gray-600 dark:bg-gray-900"
      />
      <input
        {...register('amount', { required: true })}
        placeholder="金額"
        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm sm:flex-1 dark:border-gray-600 dark:bg-gray-900"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={updatePayment.isPending} className="flex-1 sm:flex-none">
          儲存
        </Button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          取消
        </button>
      </div>
    </form>
  )
}

function AddPaymentModal({ loan, onClose }: { loan: CarLoan; onClose: () => void }) {
  const createPayment = useCreateCarLoanPayment(loan.id)
  const { register, handleSubmit } = useForm<CarLoanPaymentCreate>()

  return (
    <Modal title={`新增還款紀錄 - ${loan.description}`} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit((values) => createPayment.mutate(values, { onSuccess: onClose }))}
      >
        <div>
          <label className="mb-1 block text-xs text-gray-500">還款日期</label>
          <input
            type="date"
            {...register('payment_date', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">金額</label>
          <input
            {...register('amount', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <Button type="submit" disabled={createPayment.isPending}>
          新增
        </Button>
      </form>
    </Modal>
  )
}

export function LoanSection() {
  const { data: loans } = useCarLoans()
  const createLoan = useCreateCarLoan()
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [addPaymentLoanId, setAddPaymentLoanId] = useState<number | null>(null)

  const loanForm = useForm<CarLoanCreate>()
  const updateLoan = useUpdateCarLoan(selectedLoanId ?? 0)
  const { data: payments } = useCarLoanPayments(selectedLoanId ?? 0)
  const { format } = useCurrency()

  const selectedLoan = loans?.find((loan) => loan.id === selectedLoanId) ?? null
  const addPaymentLoan = loans?.find((loan) => loan.id === addPaymentLoanId) ?? null
  const editForm = useForm<CarLoanUpdate>({ defaultValues: selectedLoan ?? {} })

  return (
    <div className="flex flex-col gap-6">
      <Card title="貸款列表">
        <div className="flex flex-col">
          {loans?.map((loan) => (
            <div
              key={loan.id}
              className={`flex items-center justify-between border-b border-gray-100 px-2 py-3 text-sm last:border-b-0 dark:border-gray-700/50 ${
                selectedLoanId === loan.id ? 'bg-wisteria/15 dark:bg-glaucous/20' : ''
              }`}
            >
              <button
                onClick={() => setSelectedLoanId(loan.id === selectedLoanId ? null : loan.id)}
                className="flex-1 text-left"
              >
                <p className="font-medium">{loan.description}</p>
                <p className="text-xs text-gray-500">
                  總額 {format(loan.total_amount)} · 已還 {format(loan.paid_to_date)} · 剩餘{' '}
                  {format(loan.remaining_balance)}
                </p>
              </button>
              <button
                onClick={() => {
                  setSelectedLoanId(loan.id)
                  setAddPaymentLoanId(loan.id)
                }}
                aria-label="新增還款紀錄"
                className="ml-2 shrink-0 rounded-md bg-shamrock px-2 py-1 text-xs text-white hover:brightness-90"
              >
                + 還款
              </button>
              <button
                onClick={() => {
                  setSelectedLoanId(loan.id)
                  editForm.reset(loan)
                  setShowEdit(true)
                }}
                aria-label="編輯貸款"
                className="ml-2 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✏️
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="還款紀錄">
        {!selectedLoan && <p className="text-sm text-gray-500">請先在上面「貸款列表」選一筆</p>}
        {selectedLoan && (
          <PaymentsList key={selectedLoan.id} payments={payments ?? []} loanId={selectedLoan.id} />
        )}
      </Card>

      <Card title="新增貸款">
        <form
          className="flex flex-col gap-3"
          onSubmit={loanForm.handleSubmit((values) =>
            createLoan.mutate(values, { onSuccess: () => loanForm.reset() }),
          )}
        >
          <input
            {...loanForm.register('description', { required: true })}
            placeholder="項目描述,如車貸/跟朋友借的錢"
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
            新增貸款
          </Button>
        </form>
      </Card>

      {showEdit && selectedLoan && (
        <Modal title="編輯貸款" onClose={() => setShowEdit(false)}>
          <form
            className="flex flex-col gap-3"
            onSubmit={editForm.handleSubmit((values) =>
              updateLoan.mutate(values, { onSuccess: () => setShowEdit(false) }),
            )}
          >
            <div>
              <label className="mb-1 block text-xs text-gray-500">項目描述</label>
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

      {addPaymentLoan && (
        <AddPaymentModal loan={addPaymentLoan} onClose={() => setAddPaymentLoanId(null)} />
      )}
    </div>
  )
}

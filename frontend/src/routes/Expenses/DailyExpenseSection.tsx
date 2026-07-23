import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense } from '../../hooks/useExpenses'
import { useCurrency } from '../../contexts/CurrencyContext'
import { toIsoDate } from '../../lib/dateHelpers'
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../../types/api'

const VISIBLE_EXPENSES_DEFAULT = 5

function ExpenseRow({ expense }: { expense: Expense }) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const updateExpense = useUpdateExpense(expense.id)
  const deleteExpense = useDeleteExpense()
  const { register, handleSubmit, reset } = useForm<ExpenseUpdate>({
    defaultValues: {
      expense_date: expense.expense_date,
      description: expense.description,
      amount: expense.amount,
    },
  })
  const { format } = useCurrency()

  if (isEditing) {
    return (
      <form
        className="flex flex-col gap-2 border-b border-gray-100 px-2 py-3 last:border-b-0 sm:flex-row sm:items-center dark:border-gray-700/50"
        onSubmit={handleSubmit((values) =>
          updateExpense.mutate(values, { onSuccess: () => setIsEditing(false) }),
        )}
      >
        <input
          type="date"
          {...register('expense_date', { required: true })}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm sm:flex-1 dark:border-gray-600 dark:bg-gray-900"
        />
        <input
          {...register('description', { required: true })}
          placeholder="項目"
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm sm:flex-1 dark:border-gray-600 dark:bg-gray-900"
        />
        <input
          {...register('amount', { required: true })}
          placeholder="金額"
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm sm:flex-1 dark:border-gray-600 dark:bg-gray-900"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={updateExpense.isPending} className="flex-1 sm:flex-none">
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

  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-2 py-3 text-sm last:border-b-0 dark:border-gray-700/50">
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{expense.description}</p>
        <p className="text-xs text-gray-500">{expense.expense_date}</p>
      </div>
      <div className="flex items-center gap-2">
        {!confirmingDelete && (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {format(expense.amount)}
            </span>
            <button
              onClick={() => {
                reset({
                  expense_date: expense.expense_date,
                  description: expense.description,
                  amount: expense.amount,
                })
                setIsEditing(true)
              }}
              aria-label="編輯支出"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✏️
            </button>
            <button onClick={() => setConfirmingDelete(true)} className="text-xs text-red-500">
              刪除
            </button>
          </>
        )}
        {confirmingDelete && (
          <>
            <span className="text-xs text-gray-500">確定刪除?</span>
            <button
              onClick={() => {
                deleteExpense.mutate(expense.id)
                setConfirmingDelete(false)
              }}
              className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:brightness-90"
            >
              確定
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              取消
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function DailyExpenseSection() {
  const { data: expenses } = useExpenses()
  const [showAll, setShowAll] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const createExpense = useCreateExpense()
  const { register, handleSubmit, reset } = useForm<ExpenseCreate>({
    defaultValues: { expense_date: toIsoDate(new Date()) },
  })

  const sorted = expenses ? [...expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date)) : []
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_EXPENSES_DEFAULT)

  return (
    <Card
      title="日常開銷"
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-md bg-shamrock px-2 py-1 text-xs text-white hover:brightness-90"
        >
          + 新增支出
        </button>
      }
    >
      {sorted.length === 0 && <p className="text-sm text-gray-500">尚無支出紀錄</p>}
      <div className="flex flex-col">
        {visible.map((expense) => (
          <ExpenseRow key={expense.id} expense={expense} />
        ))}
      </div>
      {sorted.length > VISIBLE_EXPENSES_DEFAULT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 self-start text-xs text-glaucous dark:text-wisteria"
        >
          {showAll ? '收起 ▲' : `顯示更多(共 ${sorted.length} 筆) ▼`}
        </button>
      )}

      {showAddModal && (
        <Modal title="新增支出" onClose={() => setShowAddModal(false)}>
          <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit((values) =>
              createExpense.mutate(values, {
                onSuccess: () => {
                  reset({ expense_date: toIsoDate(new Date()) })
                  setShowAddModal(false)
                },
              }),
            )}
          >
            <div>
              <label className="mb-1 block text-xs text-gray-500">日期</label>
              <input
                type="date"
                {...register('expense_date', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">項目</label>
              <input
                {...register('description', { required: true })}
                placeholder="例如 超市買菜"
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
            <Button type="submit" disabled={createExpense.isPending}>
              新增
            </Button>
          </form>
        </Modal>
      )}
    </Card>
  )
}

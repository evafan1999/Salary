import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { addWeeks } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useShifts, useDeleteShift } from '../../hooks/useShifts'
import { useJobs } from '../../hooks/useJobs'
import {
  useCreateExtraIncome,
  useDeleteExtraIncome,
  useExtraIncome,
  useUpdateExtraIncome,
} from '../../hooks/useExtraIncome'
import { getWeekRange, toIsoDate, formatDisplayDate } from '../../lib/dateHelpers'
import { roundTo2 } from '../../lib/formatNumber'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ShiftFormDrawer } from './ShiftFormDrawer'
import type { ExtraIncome, ExtraIncomeCreate, ExtraIncomeUpdate, Shift } from '../../types/api'

function isShiftOver(shift: Shift, now: Date): boolean {
  const end = new Date(`${shift.shift_date}T${shift.end_time}`)
  if (shift.crosses_midnight) {
    end.setDate(end.getDate() + 1)
  }
  return end <= now
}

function ShiftRow({
  shift,
  jobName,
  isOver,
  confirmingDelete,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
}: {
  shift: Shift
  jobName: string
  isOver: boolean
  confirmingDelete: boolean
  onDeleteClick: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  const { format } = useCurrency()

  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-2 py-3 text-sm last:border-b-0 dark:border-gray-700/50">
      <div className={isOver ? 'text-gray-400 line-through decoration-gray-400 dark:text-gray-500' : ''}>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {shift.shift_date} · {jobName}
        </p>
        <p className="text-xs text-gray-500">
          {shift.start_time}–{shift.end_time} · {roundTo2(shift.worked_hours)}h · {shift.resolved_day_type}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!confirmingDelete && (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {format(shift.gross_pay)}
            </span>
            <button onClick={onDeleteClick} className="text-xs text-red-500">
              刪除
            </button>
          </>
        )}
        {confirmingDelete && (
          <>
            <span className="text-xs text-gray-500">確定刪除這筆班表?</span>
            <button
              onClick={onConfirmDelete}
              className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:brightness-90"
            >
              確定
            </button>
            <button
              onClick={onCancelDelete}
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

function ExtraIncomeRow({
  income,
  confirmingDelete,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
}: {
  income: ExtraIncome
  confirmingDelete: boolean
  onDeleteClick: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const updateIncome = useUpdateExtraIncome(income.id)
  const { register, handleSubmit, reset } = useForm<ExtraIncomeUpdate>({
    defaultValues: {
      income_date: income.income_date,
      description: income.description,
      amount: income.amount,
    },
  })
  const { format } = useCurrency()

  if (isEditing) {
    return (
      <form
        className="flex flex-col gap-2 border-b border-gray-100 px-2 py-3 last:border-b-0 sm:flex-row sm:items-center dark:border-gray-700/50"
        onSubmit={handleSubmit((values) =>
          updateIncome.mutate(values, { onSuccess: () => setIsEditing(false) }),
        )}
      >
        <input
          type="date"
          {...register('income_date', { required: true })}
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
          <Button type="submit" disabled={updateIncome.isPending} className="flex-1 sm:flex-none">
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
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {income.income_date} · {income.description}
        </p>
        <p className="text-xs text-gray-500">額外收入</p>
      </div>
      <div className="flex items-center gap-2">
        {!confirmingDelete && (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {format(income.amount)}
            </span>
            <button
              onClick={() => {
                reset({
                  income_date: income.income_date,
                  description: income.description,
                  amount: income.amount,
                })
                setIsEditing(true)
              }}
              aria-label="編輯額外收入"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✏️
            </button>
            <button onClick={onDeleteClick} className="text-xs text-red-500">
              刪除
            </button>
          </>
        )}
        {confirmingDelete && (
          <>
            <span className="text-xs text-gray-500">確定刪除?</span>
            <button
              onClick={onConfirmDelete}
              className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:brightness-90"
            >
              確定
            </button>
            <button
              onClick={onCancelDelete}
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

function AddExtraIncomeModal({ defaultDate, onClose }: { defaultDate: string; onClose: () => void }) {
  const createIncome = useCreateExtraIncome()
  const { register, handleSubmit } = useForm<ExtraIncomeCreate>({
    defaultValues: { income_date: defaultDate },
  })

  return (
    <Modal title="新增額外收入" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit((values) => createIncome.mutate(values, { onSuccess: onClose }))}
      >
        <div>
          <label className="mb-1 block text-xs text-gray-500">日期</label>
          <input
            type="date"
            {...register('income_date', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">項目</label>
          <input
            {...register('description', { required: true })}
            placeholder="例如 樓下店家幫忙"
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
        <Button type="submit" disabled={createIncome.isPending}>
          新增
        </Button>
      </form>
    </Modal>
  )
}

export function ShiftsWeeklyPage() {
  const [anchor, setAnchor] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [showExtraIncomeForm, setShowExtraIncomeForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [confirmDeleteIncomeId, setConfirmDeleteIncomeId] = useState<number | null>(null)
  const { start, end } = getWeekRange(anchor)
  const { data: shifts, isLoading } = useShifts({
    start_date: toIsoDate(start),
    end_date: toIsoDate(end),
  })
  const { data: extraIncome } = useExtraIncome({
    start_date: toIsoDate(start),
    end_date: toIsoDate(end),
  })
  const { data: jobs } = useJobs()
  const deleteShift = useDeleteShift()
  const deleteExtraIncome = useDeleteExtraIncome()
  const { format } = useCurrency()

  const jobName = (jobId: number) => jobs?.find((j) => j.id === jobId)?.name ?? `Job #${jobId}`

  const totalShiftPay = shifts?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0
  const totalExtraIncome = extraIncome?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const totalGrossPay = totalShiftPay + totalExtraIncome
  const totalWorkedHours = shifts?.reduce((sum, s) => sum + Number(s.worked_hours), 0) ?? 0

  const now = new Date()
  const orderedShifts = shifts
    ? [...shifts].sort((a, b) => Number(isShiftOver(a, now)) - Number(isShiftOver(b, now)))
    : shifts

  const isEmpty = (shifts?.length ?? 0) === 0 && (extraIncome?.length ?? 0) === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-dusk dark:text-white">班表</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowExtraIncomeForm(true)}>
            + 額外收入
          </Button>
          <Button onClick={() => setShowForm(true)}>+ 新增班表</Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setAnchor(addWeeks(anchor, -1))}>
          ← 上週
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatDisplayDate(start)} - {formatDisplayDate(end)}
        </span>
        <Button variant="secondary" onClick={() => setAnchor(addWeeks(anchor, 1))}>
          下週 →
        </Button>
      </div>

      <Card title={`本週總收入: ${format(totalGrossPay)} · 總時數: ${roundTo2(totalWorkedHours)}h`}>
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        <div className="flex flex-col">
          {isEmpty && <p className="text-sm text-gray-500">這週還沒有班表或額外收入</p>}
          {orderedShifts?.map((shift) => (
            <ShiftRow
              key={shift.id}
              shift={shift}
              jobName={jobName(shift.job_id)}
              isOver={isShiftOver(shift, now)}
              confirmingDelete={confirmDeleteId === shift.id}
              onDeleteClick={() => setConfirmDeleteId(shift.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={() => {
                deleteShift.mutate(shift.id)
                setConfirmDeleteId(null)
              }}
            />
          ))}
          {extraIncome?.map((income) => (
            <ExtraIncomeRow
              key={income.id}
              income={income}
              confirmingDelete={confirmDeleteIncomeId === income.id}
              onDeleteClick={() => setConfirmDeleteIncomeId(income.id)}
              onCancelDelete={() => setConfirmDeleteIncomeId(null)}
              onConfirmDelete={() => {
                deleteExtraIncome.mutate(income.id)
                setConfirmDeleteIncomeId(null)
              }}
            />
          ))}
        </div>
      </Card>

      {showForm && <ShiftFormDrawer weekStart={start} onClose={() => setShowForm(false)} />}
      {showExtraIncomeForm && (
        <AddExtraIncomeModal
          defaultDate={toIsoDate(new Date())}
          onClose={() => setShowExtraIncomeForm(false)}
        />
      )}
    </div>
  )
}

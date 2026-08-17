import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { addWeeks, eachDayOfInterval } from 'date-fns'
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
import { getWeekRange, toIsoDate, parseIsoDate, formatDisplayDate } from '../../lib/dateHelpers'
import { roundTo2 } from '../../lib/formatNumber'
import { fallbackJobColor } from '../../lib/jobColors'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ShiftFormDrawer } from './ShiftFormDrawer'
import { EditShiftModal } from './EditShiftModal'
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
  jobColor,
  isOver,
  confirmingDelete,
  onEditClick,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
  showDot = true,
  titleOverride,
}: {
  shift: Shift
  jobName: string
  jobColor: string
  isOver: boolean
  confirmingDelete: boolean
  onEditClick: () => void
  onDeleteClick: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  /** Hide the job color dot — used in 依工作 grouping, where the job's color
   * already appears once on the group header and repeating it per row would
   * be redundant. */
  showDot?: boolean
  /** Overrides the bold title line (normally the job name) — used in 依工作
   * grouping to show the shift's date instead, since the job name is already
   * the group header there. */
  titleOverride?: string
}) {
  const { format } = useCurrency()

  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-2 py-3 text-sm last:border-b-0 dark:border-gray-700/50">
      <div
        className={`flex items-center gap-2 ${isOver ? 'text-gray-400 line-through decoration-gray-400 dark:text-gray-500' : ''}`}
      >
        {showDot && (
          <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full" style={{ backgroundColor: jobColor }} />
            {isOver && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white text-[7px] leading-none text-emerald-600 ring-1 ring-white dark:bg-gray-900 dark:ring-gray-900"
              >
                ✓
              </span>
            )}
          </span>
        )}
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{titleOverride ?? jobName}</p>
          <p className="text-xs text-gray-500">
            {shift.start_time}–{shift.end_time} · {roundTo2(shift.worked_hours)}h · {shift.resolved_day_type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!confirmingDelete && (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {format(shift.gross_pay)}
            </span>
            <button onClick={onEditClick} aria-label="編輯班表" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              ✏️
            </button>
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
  showDate = false,
}: {
  income: ExtraIncome
  confirmingDelete: boolean
  onDeleteClick: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  /** Prefix the row with its date — used in 依工作 grouping, where extra
   * income isn't nested under a date header. */
  showDate?: boolean
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
          {showDate ? `${formatDisplayDate(parseIsoDate(income.income_date))} · ${income.description}` : income.description}
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
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [groupBy, setGroupBy] = useState<'date' | 'job'>('date')
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
  const jobColor = (jobId: number) => jobs?.find((j) => j.id === jobId)?.color ?? fallbackJobColor(jobId)

  const totalShiftPay = shifts?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0
  const totalExtraIncome = extraIncome?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const totalGrossPay = totalShiftPay + totalExtraIncome
  const totalWorkedHours = shifts?.reduce((sum, s) => sum + Number(s.worked_hours), 0) ?? 0

  const now = new Date()

  // Group shifts and extra income by date so the list reads as a day-by-day
  // schedule instead of one long flat list.
  const dayGroups = new Map<string, { shifts: Shift[]; incomes: ExtraIncome[] }>()
  shifts?.forEach((shift) => {
    const group = dayGroups.get(shift.shift_date) ?? { shifts: [], incomes: [] }
    group.shifts.push(shift)
    dayGroups.set(shift.shift_date, group)
  })
  extraIncome?.forEach((income) => {
    const group = dayGroups.get(income.income_date) ?? { shifts: [], incomes: [] }
    group.incomes.push(income)
    dayGroups.set(income.income_date, group)
  })
  const weekDates = eachDayOfInterval({ start, end }).map(toIsoDate)

  // Group shifts by job for the 依工作 view — extra income has no job so it
  // gets its own section, rendered separately below the job cards.
  const jobGroups = new Map<number, Shift[]>()
  shifts?.forEach((shift) => {
    const list = jobGroups.get(shift.job_id) ?? []
    list.push(shift)
    jobGroups.set(shift.job_id, list)
  })
  const orderedJobGroups = [...jobGroups.entries()].sort(([a], [b]) =>
    jobName(a).localeCompare(jobName(b)),
  )

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

      <Card
        title={`本週總收入: ${format(totalGrossPay)} · 總時數: ${roundTo2(totalWorkedHours)}h`}
        actions={
          <div className="flex gap-1">
            <button
              onClick={() => setGroupBy('date')}
              className={`rounded-full px-3 py-1 text-xs ${
                groupBy === 'date'
                  ? 'bg-dusk text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              依日期
            </button>
            <button
              onClick={() => setGroupBy('job')}
              className={`rounded-full px-3 py-1 text-xs ${
                groupBy === 'job'
                  ? 'bg-dusk text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              依工作
            </button>
          </div>
        }
      >
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        {isEmpty && <p className="text-sm text-gray-500">這週還沒有班表或額外收入</p>}

        {!isEmpty && groupBy === 'date' && (
          <div className="flex flex-col gap-2">
            {weekDates.map((date) => {
              const group = dayGroups.get(date)
              const dateLabel = formatDisplayDate(parseIsoDate(date))
              if (!group) {
                return (
                  <div
                    key={date}
                    className="rounded-xl border border-dashed border-gray-200 px-3 py-2.5 text-center dark:border-gray-700"
                  >
                    <span className="text-xs text-gray-400">{dateLabel} · 休假</span>
                  </div>
                )
              }
              const dayHours = group.shifts.reduce((sum, s) => sum + Number(s.worked_hours), 0)
              const dayTotal =
                group.shifts.reduce((sum, s) => sum + Number(s.gross_pay), 0) +
                group.incomes.reduce((sum, i) => sum + Number(i.amount), 0)
              return (
                <div key={date} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{dateLabel}</span>
                    <span className="text-xs text-gray-500">
                      {roundTo2(dayHours)}h · {format(dayTotal)}
                    </span>
                  </div>
                  <div className="flex flex-col px-1">
                    {[...group.shifts]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((shift) => (
                        <ShiftRow
                          key={shift.id}
                          shift={shift}
                          jobName={jobName(shift.job_id)}
                          jobColor={jobColor(shift.job_id)}
                          isOver={isShiftOver(shift, now)}
                          confirmingDelete={confirmDeleteId === shift.id}
                          onEditClick={() => setEditingShift(shift)}
                          onDeleteClick={() => setConfirmDeleteId(shift.id)}
                          onCancelDelete={() => setConfirmDeleteId(null)}
                          onConfirmDelete={() => {
                            deleteShift.mutate(shift.id)
                            setConfirmDeleteId(null)
                          }}
                        />
                      ))}
                    {group.incomes.map((income) => (
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
                </div>
              )
            })}
          </div>
        )}

        {!isEmpty && groupBy === 'job' && (
          <div className="flex flex-col gap-2">
            {orderedJobGroups.map(([jobId, jobShifts]) => {
              const hours = jobShifts.reduce((sum, s) => sum + Number(s.worked_hours), 0)
              const total = jobShifts.reduce((sum, s) => sum + Number(s.gross_pay), 0)
              return (
                <div key={jobId} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: jobColor(jobId) }}
                      />
                      {jobName(jobId)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {jobShifts.length} 班 · {roundTo2(hours)}h · {format(total)}
                    </span>
                  </div>
                  <div className="flex flex-col px-1">
                    {[...jobShifts]
                      .sort(
                        (a, b) =>
                          a.shift_date.localeCompare(b.shift_date) ||
                          a.start_time.localeCompare(b.start_time),
                      )
                      .map((shift) => (
                        <ShiftRow
                          key={shift.id}
                          shift={shift}
                          jobName={jobName(shift.job_id)}
                          jobColor={jobColor(shift.job_id)}
                          isOver={isShiftOver(shift, now)}
                          confirmingDelete={confirmDeleteId === shift.id}
                          onEditClick={() => setEditingShift(shift)}
                          onDeleteClick={() => setConfirmDeleteId(shift.id)}
                          onCancelDelete={() => setConfirmDeleteId(null)}
                          onConfirmDelete={() => {
                            deleteShift.mutate(shift.id)
                            setConfirmDeleteId(null)
                          }}
                          showDot={false}
                          titleOverride={formatDisplayDate(parseIsoDate(shift.shift_date))}
                        />
                      ))}
                  </div>
                </div>
              )
            })}
            {extraIncome && extraIncome.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">額外收入</span>
                  <span className="text-xs text-gray-500">{format(totalExtraIncome)}</span>
                </div>
                <div className="flex flex-col px-1">
                  {extraIncome.map((income) => (
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
                      showDate
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {showForm && <ShiftFormDrawer weekStart={start} onClose={() => setShowForm(false)} />}
      {showExtraIncomeForm && (
        <AddExtraIncomeModal
          defaultDate={toIsoDate(new Date())}
          onClose={() => setShowExtraIncomeForm(false)}
        />
      )}
      {editingShift && (
        <EditShiftModal shift={editingShift} onClose={() => setEditingShift(null)} />
      )}
    </div>
  )
}

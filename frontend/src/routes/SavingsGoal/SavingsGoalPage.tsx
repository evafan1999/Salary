import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { differenceInCalendarDays } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useCreateSavingsGoal, useSavingsGoal } from '../../hooks/useSavingsGoal'
import { useCarLoans } from '../../hooks/useCarLoan'
import { useCurrency } from '../../contexts/CurrencyContext'
import type { SavingsGoalCreate } from '../../types/api'

const MIN_WEEKS = 0.01

export function SavingsGoalPage() {
  const { data: goal, isLoading } = useSavingsGoal()
  const { data: carLoans } = useCarLoans()
  const createGoal = useCreateSavingsGoal()
  const [showEdit, setShowEdit] = useState(false)
  const { register, handleSubmit, reset } = useForm<SavingsGoalCreate>({
    defaultValues: { starting_balance: '0' },
  })
  const { format } = useCurrency()

  const netSaved = goal ? Number(goal.net_saved_so_far) : 0
  const target = goal ? Number(goal.target_amount) : 0
  const requiredWeekly = goal ? Number(goal.required_weekly_savings) : 0
  const weeksRemaining = goal ? Number(goal.weeks_remaining) : 0

  const goalPercent = target > 0 ? (netSaved / target) * 100 : 0

  const weeksElapsed = goal
    ? Math.max(differenceInCalendarDays(new Date(), new Date(goal.tracking_start_date)) / 7, MIN_WEEKS)
    : MIN_WEEKS
  const totalWeeks = weeksElapsed + weeksRemaining
  const timePercent = totalWeeks > 0 ? (weeksElapsed / totalWeeks) * 100 : 0

  const actualWeeklyRate = netSaved / weeksElapsed
  const paceRatio = requiredWeekly > 0 ? (actualWeeklyRate / requiredWeekly) * 100 : 100

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">存錢目標</h1>

      <Card
        title="目前進度"
        actions={
          <button
            onClick={() => setShowEdit(true)}
            aria-label="編輯目標"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✏️
          </button>
        }
      >
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        {!goal && !isLoading && (
          <p className="text-sm text-gray-500">尚未設定目標,點右上角編輯圖示新增</p>
        )}
        {goal && (
          <div className="flex flex-col gap-1 text-sm">
            <p>
              目標: {format(goal.target_amount)} · 離澳日: {goal.target_date}
            </p>
            <p>目前已存: {format(goal.net_saved_so_far)}</p>
            <p>剩餘週數: {weeksRemaining.toFixed(1)}</p>
            <p className="font-semibold text-glaucous dark:text-wisteria">
              每週需存: {format(goal.required_weekly_savings)}
            </p>
          </div>
        )}
      </Card>

      {goal && (
        <Card title="影響存錢的進度">
          <div className="flex flex-col gap-4">
            <ProgressBar
              label="存錢目標達成率"
              subtitle={`${goalPercent.toFixed(1)}%`}
              percent={goalPercent}
              colorClass="bg-glaucous"
            />
            <ProgressBar
              label="時間進度(距離離澳日)"
              subtitle={`${timePercent.toFixed(1)}%`}
              percent={timePercent}
              colorClass="bg-wisteria"
            />
            <ProgressBar
              label="每週實際存款 vs 需要存款"
              subtitle={`${format(actualWeeklyRate)} / ${format(requiredWeekly)}`}
              percent={paceRatio}
              colorClass={paceRatio >= 100 ? 'bg-shamrock' : 'bg-red-500'}
            />
            {carLoans && carLoans.length > 0 ? (
              carLoans.map((loan) => (
                <ProgressBar
                  key={loan.id}
                  label={`還款進度: ${loan.description}`}
                  subtitle={`${format(loan.paid_to_date)} / ${format(loan.total_amount)}`}
                  percent={(Number(loan.paid_to_date) / Number(loan.total_amount)) * 100}
                  colorClass="bg-deepteal"
                />
              ))
            ) : (
              <p className="text-xs text-gray-500">尚未設定貸款</p>
            )}
          </div>
        </Card>
      )}

      {showEdit && (
        <Modal title={goal ? '更新目標(會取代目前目標)' : '設定目標'} onClose={() => setShowEdit(false)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit((values) =>
              createGoal.mutate(values, {
                onSuccess: () => {
                  reset()
                  setShowEdit(false)
                },
              }),
            )}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                目標金額
              </label>
              <p className="mb-1 text-xs text-gray-500">你想在離澳前存到多少錢</p>
              <input
                {...register('target_amount', { required: true })}
                placeholder="例如 20000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                離澳日期
              </label>
              <p className="mb-1 text-xs text-gray-500">
                計劃離開澳洲的日子,用來算「剩餘週數」和「每週還要存多少」
              </p>
              <input
                type="date"
                {...register('target_date', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                開始追蹤前已存金額
              </label>
              <p className="mb-1 text-xs text-gray-500">
                在你開始用這個工具之前,已經存下的錢(會加進「目前已存」,不然只算之後班表賺的錢會少算)
              </p>
              <input
                {...register('starting_balance')}
                placeholder="例如 1000,沒有就填 0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                開始追蹤日期
              </label>
              <p className="mb-1 text-xs text-gray-500">
                從哪一天開始,系統才會把班表收入、房租、貸款還款算進「目前已存」——通常填今天
              </p>
              <input
                type="date"
                {...register('tracking_start_date', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <Button type="submit" disabled={createGoal.isPending}>
              儲存目標
            </Button>
          </form>
        </Modal>
      )}
    </div>
  )
}

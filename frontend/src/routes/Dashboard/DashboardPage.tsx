import { differenceInCalendarDays } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useDashboardSummary } from '../../hooks/useDashboardSummary'
import { useCurrency } from '../../contexts/CurrencyContext'

const MIN_WEEKS = 0.01

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary()
  const { format } = useCurrency()

  if (isLoading) return <p className="text-sm text-gray-500">載入中...</p>
  if (error) return <p className="text-sm text-red-600">載入失敗: {(error as Error).message}</p>
  if (!data) return null

  const goal = data.savings_goal
  const netSaved = goal ? Number(goal.net_saved_so_far) : 0
  const target = goal ? Number(goal.target_amount) : 0
  const requiredWeekly = goal ? Number(goal.required_weekly_savings) : 0
  const goalPercent = target > 0 ? (netSaved / target) * 100 : 0

  const weeksElapsed = goal
    ? Math.max(differenceInCalendarDays(new Date(), new Date(goal.tracking_start_date)) / 7, MIN_WEEKS)
    : MIN_WEEKS
  const actualWeeklyRate = netSaved / weeksElapsed
  const paceRatio = requiredWeekly > 0 ? (actualWeeklyRate / requiredWeekly) * 100 : 100

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">總覽</h1>

      <Card title={`本週收入 (${data.current_period_start} ~ ${data.current_period_end})`}>
        <div className="flex flex-col gap-1 text-sm">
          {data.earnings_by_job.map((e) => (
            <div key={e.job_id} className="flex justify-between">
              <span>{e.job_name}</span>
              <span>{format(e.gross_pay)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold dark:border-gray-700">
            <span>總計</span>
            <span>{format(data.total_current_period_earnings)}</span>
          </div>
        </div>
      </Card>

      <Card title="存錢目標">
        {!goal && <p className="text-sm text-gray-500">尚未設定目標</p>}
        {goal && (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              已存 {format(goal.net_saved_so_far)} / {format(goal.target_amount)}
            </p>
            <p className="font-semibold text-glaucous dark:text-wisteria">
              每週需存 {format(goal.required_weekly_savings)}
            </p>
            <ProgressBar
              label="總進度"
              subtitle={`${goalPercent.toFixed(1)}%`}
              percent={goalPercent}
              colorClass="bg-glaucous"
            />
            <ProgressBar
              label="週進度"
              subtitle={`${format(actualWeeklyRate)} / ${format(requiredWeekly)}`}
              percent={paceRatio}
              colorClass={paceRatio >= 100 ? 'bg-shamrock' : 'bg-red-500'}
            />
          </div>
        )}
      </Card>

      <Card title="下次房租到期">
        {data.upcoming_rent.length === 0 && <p className="text-sm text-gray-500">尚未設定</p>}
        {data.upcoming_rent.map((r) => (
          <div key={r.rent_period_id} className="flex justify-between text-sm">
            <span>{r.label}</span>
            <span>
              {format(r.amount)} · {r.due_date}
            </span>
          </div>
        ))}
      </Card>

      <Card title="貸款">
        {data.car_loans.length === 0 && <p className="text-sm text-gray-500">尚未設定</p>}
        {data.car_loans.map((loan) => (
          <div key={loan.id} className="flex justify-between text-sm">
            <span>{loan.description}</span>
            <span>剩餘 {format(loan.remaining_balance)}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

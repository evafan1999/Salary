import { useState } from 'react'
import { addMonths, addWeeks, differenceInCalendarDays, endOfMonth, startOfMonth } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useDashboardSummary } from '../../hooks/useDashboardSummary'
import { useShifts } from '../../hooks/useShifts'
import { useExtraIncome } from '../../hooks/useExtraIncome'
import { useJobs } from '../../hooks/useJobs'
import {
  formatDisplayDate,
  formatDisplayMonth,
  getWeekRange,
  toIsoDate,
} from '../../lib/dateHelpers'
import { roundTo2 } from '../../lib/formatNumber'
import { useCurrency } from '../../contexts/CurrencyContext'

const MIN_WEEKS = 0.01

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary()
  const { data: jobs } = useJobs()
  const { format } = useCurrency()

  const [weekAnchor, setWeekAnchor] = useState(new Date())
  const { start: weekStart, end: weekEnd } = getWeekRange(weekAnchor)
  const { data: weekShifts } = useShifts({
    start_date: toIsoDate(weekStart),
    end_date: toIsoDate(weekEnd),
  })
  const { data: weekExtraIncome } = useExtraIncome({
    start_date: toIsoDate(weekStart),
    end_date: toIsoDate(weekEnd),
  })

  const [monthAnchor, setMonthAnchor] = useState(new Date())
  const monthStart = startOfMonth(monthAnchor)
  const monthEnd = endOfMonth(monthAnchor)
  const { data: monthShifts } = useShifts({
    start_date: toIsoDate(monthStart),
    end_date: toIsoDate(monthEnd),
  })
  const { data: monthExtraIncome } = useExtraIncome({
    start_date: toIsoDate(monthStart),
    end_date: toIsoDate(monthEnd),
  })

  if (isLoading) return <p className="text-sm text-gray-500">載入中...</p>
  if (error) return <p className="text-sm text-red-600">載入失敗: {(error as Error).message}</p>
  if (!data) return null

  const jobName = (jobId: number) => jobs?.find((j) => j.id === jobId)?.name ?? `Job #${jobId}`

  const weekEarningsByJob = new Map<number, number>()
  weekShifts?.forEach((s) => {
    weekEarningsByJob.set(s.job_id, (weekEarningsByJob.get(s.job_id) ?? 0) + Number(s.gross_pay))
  })
  const weekExtraIncomeTotal = weekExtraIncome?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const weekShiftTotal = weekShifts?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0
  const weekTotal = weekShiftTotal + weekExtraIncomeTotal

  const monthShiftIncome = monthShifts?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0
  const monthExtraIncomeTotal = monthExtraIncome?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const monthTotalIncome = monthShiftIncome + monthExtraIncomeTotal
  const monthTotalHours = monthShifts?.reduce((sum, s) => sum + Number(s.worked_hours), 0) ?? 0

  const dailyHoursMap = new Map<string, number>()
  monthShifts?.forEach((s) => {
    dailyHoursMap.set(s.shift_date, (dailyHoursMap.get(s.shift_date) ?? 0) + Number(s.worked_hours))
  })
  const distinctWorkedDays = dailyHoursMap.size
  const avgDailyHours = distinctWorkedDays > 0 ? monthTotalHours / distinctWorkedDays : 0
  const maxDailyHours = dailyHoursMap.size > 0 ? Math.max(...dailyHoursMap.values()) : 0

  // A day "off" is a day with neither a shift nor extra income; only counts
  // days that have actually happened (up through today), since future days
  // in the currently-in-progress month aren't "off" yet, just not here.
  // Pre-scheduled future shifts (e.g. from 循環週期) can exist later in the
  // same month, so the income-day set must be clipped to "today or earlier"
  // too — otherwise those future days inflate the count and can make
  // daysOff bottom out at 0 well before the month is actually elapsed.
  const today = new Date()
  const todayIso = toIsoDate(today)
  const incomeDays = new Set<string>(
    [...dailyHoursMap.keys(), ...(monthExtraIncome?.map((i) => i.income_date) ?? [])].filter(
      (date) => date <= todayIso,
    ),
  )
  let elapsedDaysInMonth = 0
  if (monthStart <= today) {
    const effectiveEnd = monthEnd < today ? monthEnd : today
    elapsedDaysInMonth = differenceInCalendarDays(effectiveEnd, monthStart) + 1
  }
  const daysOff = Math.max(elapsedDaysInMonth - incomeDays.size, 0)

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

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setWeekAnchor(addWeeks(weekAnchor, -1))}>
          ← 上週
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatDisplayDate(weekStart)} - {formatDisplayDate(weekEnd)}
        </span>
        <Button variant="secondary" onClick={() => setWeekAnchor(addWeeks(weekAnchor, 1))}>
          下週 →
        </Button>
      </div>

      <Card title="本週收入">
        <div className="flex flex-col gap-1 text-sm">
          {Array.from(weekEarningsByJob.entries()).map(([jobId, amount]) => (
            <div key={jobId} className="flex justify-between">
              <span>{jobName(jobId)}</span>
              <span>{format(amount)}</span>
            </div>
          ))}
          {weekExtraIncomeTotal > 0 && (
            <div className="flex justify-between">
              <span>額外收入</span>
              <span>{format(weekExtraIncomeTotal)}</span>
            </div>
          )}
          {weekEarningsByJob.size === 0 && weekExtraIncomeTotal === 0 && (
            <p className="text-sm text-gray-500">這週還沒有收入</p>
          )}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold dark:border-gray-700">
            <span>總計</span>
            <span>{format(weekTotal)}</span>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}>
          ← 上月
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatDisplayMonth(monthAnchor)}
        </span>
        <Button variant="secondary" onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}>
          下月 →
        </Button>
      </div>

      <Card title="當月統計">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>當月總收入</span>
            <span>{format(monthTotalIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span>總時數</span>
            <span>{roundTo2(monthTotalHours)}h</span>
          </div>
          <div className="flex justify-between">
            <span>日均工時(有上班的日子)</span>
            <span>{roundTo2(avgDailyHours)}h</span>
          </div>
          <div className="flex justify-between">
            <span>單日最高工時</span>
            <span>{roundTo2(maxDailyHours)}h</span>
          </div>
          <div className="flex justify-between">
            <span>當月休假天數</span>
            <span>{daysOff} 天</span>
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
              subtitle={`${goalPercent.toFixed(2)}%`}
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

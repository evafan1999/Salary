import { Card } from '../../components/ui/Card'
import { useDashboardSummary } from '../../hooks/useDashboardSummary'
import { useCurrency } from '../../contexts/CurrencyContext'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary()
  const { format } = useCurrency()

  if (isLoading) return <p className="text-sm text-gray-500">載入中...</p>
  if (error) return <p className="text-sm text-red-600">載入失敗: {(error as Error).message}</p>
  if (!data) return null

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

      <Card title="車貸">
        {data.car_loans.length === 0 && <p className="text-sm text-gray-500">尚未設定</p>}
        {data.car_loans.map((loan) => (
          <div key={loan.id} className="flex justify-between text-sm">
            <span>{loan.description}</span>
            <span>剩餘 {format(loan.remaining_balance)}</span>
          </div>
        ))}
      </Card>

      <Card title="存錢目標">
        {!data.savings_goal && <p className="text-sm text-gray-500">尚未設定目標</p>}
        {data.savings_goal && (
          <div className="flex flex-col gap-1 text-sm">
            <p>
              已存 {format(data.savings_goal.net_saved_so_far)} / {format(data.savings_goal.target_amount)}
            </p>
            <p className="font-semibold text-glaucous dark:text-wisteria">
              每週需存 {format(data.savings_goal.required_weekly_savings)}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

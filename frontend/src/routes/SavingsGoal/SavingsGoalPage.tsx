import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCreateSavingsGoal, useSavingsGoal } from '../../hooks/useSavingsGoal'
import type { SavingsGoalCreate } from '../../types/api'

export function SavingsGoalPage() {
  const { data: goal, isLoading } = useSavingsGoal()
  const createGoal = useCreateSavingsGoal()
  const { register, handleSubmit, reset } = useForm<SavingsGoalCreate>({
    defaultValues: { starting_balance: '0' },
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">存錢目標</h1>

      <Card title="目前進度">
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        {!goal && !isLoading && <p className="text-sm text-gray-500">尚未設定目標</p>}
        {goal && (
          <div className="flex flex-col gap-1 text-sm">
            <p>
              目標: ${goal.target_amount} · 離澳日: {goal.target_date}
            </p>
            <p>目前已存: ${Number(goal.net_saved_so_far).toFixed(2)}</p>
            <p>剩餘週數: {Number(goal.weeks_remaining).toFixed(1)}</p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              每週需存: ${Number(goal.required_weekly_savings).toFixed(2)}
            </p>
          </div>
        )}
      </Card>

      <Card title={goal ? '更新目標(會取代目前目標)' : '設定目標'}>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit((values) => createGoal.mutate(values, { onSuccess: () => reset() }))}
        >
          <input
            {...register('target_amount', { required: true })}
            placeholder="目標金額"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <input
            type="date"
            {...register('target_date', { required: true })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <input
            {...register('starting_balance')}
            placeholder="開始追蹤前已存金額"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <input
            type="date"
            {...register('tracking_start_date', { required: true })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <Button type="submit" disabled={createGoal.isPending}>
            儲存目標
          </Button>
        </form>
      </Card>
    </div>
  )
}

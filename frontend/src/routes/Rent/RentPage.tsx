import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCreateRentPeriod, useRentPeriods, useUpcomingRent } from '../../hooks/useRentPeriods'
import type { RentPeriodCreate } from '../../types/api'

export function RentPage() {
  const { data: periods } = useRentPeriods()
  const { data: upcoming } = useUpcomingRent()
  const createPeriod = useCreateRentPeriod()
  const { register, handleSubmit, reset } = useForm<RentPeriodCreate>({
    defaultValues: { cycle_days: 14 },
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">房租</h1>

      <Card title="下次到期">
        {upcoming?.length === 0 && <p className="text-sm text-gray-500">尚未設定房租週期</p>}
        {upcoming?.map((u) => (
          <div key={u.rent_period_id} className="flex justify-between text-sm">
            <span>{u.label}</span>
            <span>
              ${u.amount} · {u.due_date}
            </span>
          </div>
        ))}
      </Card>

      <Card title="新增房租週期">
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit((values) => createPeriod.mutate(values, { onSuccess: () => reset() }))}
        >
          <input
            {...register('label', { required: true })}
            placeholder="地點,如 Surry Hills share house"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <div className="flex gap-3">
            <input
              {...register('amount', { required: true })}
              placeholder="金額"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              type="number"
              {...register('cycle_days', { required: true, valueAsNumber: true })}
              placeholder="週期天數"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <input
            type="date"
            {...register('start_date', { required: true })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <input
            {...register('deposit_amount')}
            placeholder="訂金(選填)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <Button type="submit" disabled={createPeriod.isPending}>
            新增
          </Button>
        </form>
      </Card>

      <Card title="所有房租週期">
        <div className="flex flex-col gap-2">
          {periods?.map((p) => (
            <div key={p.id} className="rounded-md border border-gray-200 p-2 text-xs dark:border-gray-700">
              <p className="font-medium">{p.label}</p>
              <p className="text-gray-500">
                ${p.amount} / {p.cycle_days}天 · {p.start_date} ~ {p.end_date ?? '目前'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

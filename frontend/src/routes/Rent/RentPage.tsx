import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import {
  useCreateRentPayment,
  useCreateRentPeriod,
  useRentPeriods,
  useUpcomingRent,
} from '../../hooks/useRentPeriods'
import { formatMoney } from '../../lib/formatMoney'
import type { RentPeriodCreate, UpcomingRentDue } from '../../types/api'
import { CYCLE_PRESETS } from './cyclePresets'
import { RentPeriodDetail } from './RentPeriodDetail'

function ConfirmPaidButton({ item }: { item: UpcomingRentDue }) {
  const createPayment = useCreateRentPayment(item.rent_period_id)
  return (
    <button
      onClick={() =>
        createPayment.mutate({
          due_date: item.due_date,
          paid_date: new Date().toISOString().slice(0, 10),
          amount: item.amount,
        })
      }
      disabled={createPayment.isPending}
      className="rounded-md bg-shamrock px-2 py-1 text-xs text-white hover:brightness-90 disabled:opacity-50"
    >
      確認已繳
    </button>
  )
}

export function RentPage() {
  const { data: periods } = useRentPeriods()
  const { data: upcoming } = useUpcomingRent()
  const createPeriod = useCreateRentPeriod()
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)
  const [cycleChoice, setCycleChoice] = useState<number | 'custom'>(14)
  const { register, handleSubmit, reset, setValue } = useForm<RentPeriodCreate>({
    defaultValues: { cycle_days: 14 },
  })

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">房租</h1>

      <Card title="下次到期">
        {upcoming?.length === 0 && <p className="text-sm text-gray-500">尚未設定房租週期</p>}
        <div className="flex flex-col gap-2">
          {upcoming?.map((u) => (
            <div
              key={u.rent_period_id}
              className={`flex items-center justify-between rounded-md border p-2 text-sm ${
                u.is_overdue
                  ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <span>
                {u.is_overdue && <span className="mr-1 font-semibold text-red-600">逾期</span>}
                {u.label} · ${formatMoney(u.amount)} · {u.due_date}
              </span>
              <ConfirmPaidButton item={u} />
            </div>
          ))}
        </div>
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
          <input
            {...register('amount', { required: true })}
            placeholder="金額"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <div>
            <label className="mb-1 block text-xs text-gray-500">繳費週期</label>
            <div className="mb-2 flex gap-2">
              {CYCLE_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => {
                    setCycleChoice(preset.days)
                    setValue('cycle_days', preset.days)
                  }}
                  className={`rounded-md px-3 py-1 text-xs ${
                    cycleChoice === preset.days
                      ? 'bg-glaucous text-white'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCycleChoice('custom')}
                className={`rounded-md px-3 py-1 text-xs ${
                  cycleChoice === 'custom' ? 'bg-glaucous text-white' : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                自訂天數
              </button>
            </div>
            {cycleChoice === 'custom' && (
              <input
                type="number"
                {...register('cycle_days', { required: true, valueAsNumber: true })}
                placeholder="天數"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">開始日期</label>
            <input
              type="date"
              {...register('start_date', { required: true })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              結束日期(如果已經知道會搬走,選填;不然留空)
            </label>
            <input
              type="date"
              {...register('end_date')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
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
            <button
              key={p.id}
              onClick={() => setSelectedPeriodId(p.id === selectedPeriodId ? null : p.id)}
              className={`rounded-md border p-2 text-left text-xs ${
                selectedPeriodId === p.id
                  ? 'border-glaucous bg-wisteria/15 dark:bg-glaucous/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="font-medium">{p.label}</p>
              <p className="text-gray-500">
                ${formatMoney(p.amount)} / {p.cycle_days}天 · {p.start_date} ~ {p.end_date ?? '目前'}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {selectedPeriod && (
        <RentPeriodDetail period={selectedPeriod} onClose={() => setSelectedPeriodId(null)} />
      )}
    </div>
  )
}

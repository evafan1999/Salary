import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCreatePayRatePreset, usePayRatePresets } from '../../hooks/usePayRatePresets'
import { formatMoney } from '../../lib/formatMoney'
import type { PayRatePresetCreate } from '../../types/api'

export function PayRatePresetsSection() {
  const { data: presets } = usePayRatePresets()
  const createPreset = useCreatePayRatePreset()
  const { register, handleSubmit, reset } = useForm<PayRatePresetCreate>()

  return (
    <Card title="Fair Work 費率預設(自己從 Pay Guide 填入)">
      <div className="mb-4 flex flex-col gap-2">
        {presets?.map((preset) => (
          <div key={preset.id} className="rounded-md border border-gray-200 p-2 text-xs dark:border-gray-700">
            <p className="font-medium text-gray-800 dark:text-gray-100">{preset.name}</p>
            <p className="text-gray-500">
              平日 ${formatMoney(preset.base_hourly_rate)} · 週六 ${formatMoney(preset.saturday_rate)} · 週日 $
              {formatMoney(preset.sunday_rate)} · 假日 ${formatMoney(preset.public_holiday_rate)}
            </p>
          </div>
        ))}
      </div>
      <form
        className="grid grid-cols-2 gap-2"
        onSubmit={handleSubmit((values) => createPreset.mutate(values, { onSuccess: () => reset() }))}
      >
        <input
          {...register('name', { required: true })}
          placeholder="名稱,如 Hospitality L1 FY25-26"
          className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <input
          {...register('base_hourly_rate', { required: true })}
          placeholder="平日時薪"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <input
          {...register('saturday_rate', { required: true })}
          placeholder="週六時薪"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <input
          {...register('sunday_rate', { required: true })}
          placeholder="週日時薪"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <input
          {...register('public_holiday_rate', { required: true })}
          placeholder="公眾假日時薪"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <input
          type="date"
          {...register('effective_from', { required: true })}
          className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <Button type="submit" className="col-span-2" disabled={createPreset.isPending}>
          新增預設費率
        </Button>
      </form>
    </Card>
  )
}

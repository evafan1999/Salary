import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCreatePayRatePreset, usePayRatePresets } from '../../hooks/usePayRatePresets'
import { useCurrency } from '../../contexts/CurrencyContext'
import type { PayRatePresetCreate } from '../../types/api'

export function PayRatePresetsSection() {
  const { data: presets } = usePayRatePresets()
  const createPreset = useCreatePayRatePreset()
  const { register, handleSubmit, reset } = useForm<PayRatePresetCreate>()
  const { format } = useCurrency()

  return (
    <Card title="Fair Work 費率預設(自己從 Pay Guide 填入)">
      <div className="mb-4 flex flex-col">
        {presets?.map((preset) => (
          <div
            key={preset.id}
            className="border-b border-gray-100 px-2 py-2 text-xs last:border-b-0 dark:border-gray-700/50"
          >
            <p className="font-medium text-gray-800 dark:text-gray-100">{preset.name}</p>
            <p className="text-gray-500">
              平日 {format(preset.base_hourly_rate)} · 週六 {format(preset.saturday_rate)} · 週日{' '}
              {format(preset.sunday_rate)} · 假日 {format(preset.public_holiday_rate)}
            </p>
          </div>
        ))}
      </div>
      <form
        className="grid grid-cols-2 gap-2"
        onSubmit={handleSubmit((values) => createPreset.mutate(values, { onSuccess: () => reset() }))}
      >
        <div className="col-span-2">
          <label className="mb-1 block text-xs text-gray-500">名稱</label>
          <input
            {...register('name', { required: true })}
            placeholder="例如 Hospitality L1 FY25-26"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">平日時薪</label>
          <input
            {...register('base_hourly_rate', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">週六時薪</label>
          <input
            {...register('saturday_rate', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">週日時薪</label>
          <input
            {...register('sunday_rate', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">公眾假日時薪</label>
          <input
            {...register('public_holiday_rate', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs text-gray-500">
            生效日期(effective_from)—— 只是幫你自己標記這份費率表從哪天開始適用(例如財年 7/1
            調整),方便你之後在「工作的費率規則」裡挑選對應財年的費率,不會自動限制使用範圍
          </label>
          <input
            type="date"
            {...register('effective_from', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <Button type="submit" className="col-span-2" disabled={createPreset.isPending}>
          新增預設費率
        </Button>
      </form>
    </Card>
  )
}

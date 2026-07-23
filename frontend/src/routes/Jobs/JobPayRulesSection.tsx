import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import {
  useCreateJobPayRule,
  useCreatePayRatePreset,
  useJobPayRules,
  usePayRatePresets,
} from '../../hooks/usePayRatePresets'
import { useCurrency } from '../../contexts/CurrencyContext'
import type { JobPayRuleCreate, PayRatePresetCreate, RuleType } from '../../types/api'

const NEW_PRESET_VALUE = '__new__'

export function JobPayRulesSection({ jobId, jobName }: { jobId: number; jobName: string }) {
  const { data: rules } = useJobPayRules(jobId)
  const { data: presets } = usePayRatePresets()
  const createRule = useCreateJobPayRule(jobId)
  const createPreset = useCreatePayRatePreset()
  const [ruleType, setRuleType] = useState<RuleType>('preset')
  const [showNewPreset, setShowNewPreset] = useState(false)
  const [pendingPresetId, setPendingPresetId] = useState<number | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<JobPayRuleCreate>()
  const presetForm = useForm<PayRatePresetCreate>()
  const { format } = useCurrency()

  useEffect(() => {
    if (pendingPresetId != null && presets?.some((preset) => preset.id === pendingPresetId)) {
      setValue('preset_id', pendingPresetId)
      setPendingPresetId(null)
    }
  }, [pendingPresetId, presets, setValue])

  return (
    <Card title={`③ 設定「${jobName}」的薪資規則`}>
      <div className="mb-4 flex flex-col">
        {rules?.length === 0 && <p className="text-sm text-gray-500">尚未設定費率規則</p>}
        {rules?.map((rule) => (
          <div
            key={rule.id}
            className="border-b border-gray-100 px-2 py-2 text-xs last:border-b-0 dark:border-gray-700/50"
          >
            <p className="font-medium">
              {rule.rule_type === 'preset' ? '使用預設費率' : '自訂費率'} · 生效 {rule.effective_from}
              {rule.effective_to ? ` ~ ${rule.effective_to}` : ' ~ 目前'}
            </p>
            {rule.rule_type === 'custom' && (
              <p className="text-gray-500">
                平日 {format(rule.custom_weekday_rate)} · 週六 {format(rule.custom_saturday_rate)} · 週日{' '}
                {format(rule.custom_sunday_rate)} · 假日 {format(rule.custom_public_holiday_rate)}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mb-2 text-xs text-gray-500">
        「使用預設費率」= 套用下面已經填好的 Fair Work 官方費率表(適合咖啡廳等有照規定發薪的工作);
        「自訂費率」= 自己輸入實際拿到的時薪(適合現金、不照官方費率的工作)
      </p>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setRuleType('preset')}
          className={`rounded-md px-3 py-1 text-xs ${ruleType === 'preset' ? 'bg-glaucous text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
        >
          使用預設費率
        </button>
        <button
          type="button"
          onClick={() => setRuleType('custom')}
          className={`rounded-md px-3 py-1 text-xs ${ruleType === 'custom' ? 'bg-glaucous text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
        >
          自訂費率
        </button>
      </div>

      <form
        className="flex flex-col gap-2 sm:grid sm:grid-cols-2"
        onSubmit={handleSubmit((values) => {
          const payload: JobPayRuleCreate = { ...values, rule_type: ruleType }
          createRule.mutate(payload, { onSuccess: () => reset() })
        })}
      >
        {ruleType === 'preset' ? (
          <select
            {...register('preset_id', {
              required: true,
              valueAsNumber: true,
              onChange: (e) => {
                if (e.target.value === NEW_PRESET_VALUE) {
                  setShowNewPreset(true)
                }
              },
            })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm sm:col-span-2 dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">選擇預設費率</option>
            {presets?.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
            <option value={NEW_PRESET_VALUE}>+ 新增預設費率...</option>
          </select>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs text-gray-500">平日時薪</label>
              <input
                {...register('custom_weekday_rate', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">週六時薪</label>
              <input
                {...register('custom_saturday_rate', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">週日時薪</label>
              <input
                {...register('custom_sunday_rate', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">公眾假日時薪</label>
              <input
                {...register('custom_public_holiday_rate', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-500">生效日期</label>
          <input
            type="date"
            {...register('effective_from', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <Button type="submit" className="sm:col-span-2" disabled={createRule.isPending}>
          新增費率規則
        </Button>
        {createRule.isError && (
          <p className="text-xs text-red-600 sm:col-span-2">{(createRule.error as Error).message}</p>
        )}
      </form>

      {showNewPreset && (
        <Modal
          title="新增預設費率"
          onClose={() => {
            setShowNewPreset(false)
            setValue('preset_id', undefined as unknown as number)
          }}
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={presetForm.handleSubmit((values) => {
              createPreset.mutate(values, {
                onSuccess: (newPreset) => {
                  presetForm.reset()
                  setShowNewPreset(false)
                  setPendingPresetId(newPreset.id)
                },
              })
            })}
          >
            <div>
              <label className="mb-1 block text-xs text-gray-500">名稱</label>
              <input
                {...presetForm.register('name', { required: true })}
                placeholder="例如 Hospitality L1 FY25-26"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">平日時薪</label>
                <input
                  {...presetForm.register('base_hourly_rate', { required: true })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">週六時薪</label>
                <input
                  {...presetForm.register('saturday_rate', { required: true })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">週日時薪</label>
                <input
                  {...presetForm.register('sunday_rate', { required: true })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">公眾假日時薪</label>
                <input
                  {...presetForm.register('public_holiday_rate', { required: true })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                生效日期 —— 只是幫你自己標記這份費率表從哪天開始適用,不會限制實際使用範圍
              </label>
              <input
                type="date"
                {...presetForm.register('effective_from', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <Button type="submit" disabled={createPreset.isPending}>
              建立並套用
            </Button>
          </form>
        </Modal>
      )}
    </Card>
  )
}

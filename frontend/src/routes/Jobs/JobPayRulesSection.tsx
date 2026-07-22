import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCreateJobPayRule, useJobPayRules } from '../../hooks/usePayRatePresets'
import { usePayRatePresets } from '../../hooks/usePayRatePresets'
import { useCurrency } from '../../contexts/CurrencyContext'
import type { JobPayRuleCreate, RuleType } from '../../types/api'

export function JobPayRulesSection({ jobId }: { jobId: number }) {
  const { data: rules } = useJobPayRules(jobId)
  const { data: presets } = usePayRatePresets()
  const createRule = useCreateJobPayRule(jobId)
  const [ruleType, setRuleType] = useState<RuleType>('preset')
  const { register, handleSubmit, reset } = useForm<JobPayRuleCreate>()
  const { format } = useCurrency()

  return (
    <Card title="這份工作的費率規則">
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
        className="grid grid-cols-2 gap-2"
        onSubmit={handleSubmit((values) => {
          const payload: JobPayRuleCreate = { ...values, rule_type: ruleType }
          createRule.mutate(payload, { onSuccess: () => reset() })
        })}
      >
        {ruleType === 'preset' ? (
          <select
            {...register('preset_id', { valueAsNumber: true, required: true })}
            className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">選擇預設費率</option>
            {presets?.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              {...register('custom_weekday_rate', { required: true })}
              placeholder="平日時薪"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              {...register('custom_saturday_rate', { required: true })}
              placeholder="週六時薪"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              {...register('custom_sunday_rate', { required: true })}
              placeholder="週日時薪"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              {...register('custom_public_holiday_rate', { required: true })}
              placeholder="公眾假日時薪"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </>
        )}
        <input
          type="date"
          {...register('effective_from', { required: true })}
          className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <Button type="submit" className="col-span-2" disabled={createRule.isPending}>
          新增費率規則
        </Button>
        {createRule.isError && (
          <p className="col-span-2 text-xs text-red-600">
            {(createRule.error as Error).message}
          </p>
        )}
      </form>
    </Card>
  )
}

import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { usePayRatePresets } from '../../hooks/usePayRatePresets'
import { useCurrency } from '../../contexts/CurrencyContext'

export function PayRatePresetsSection() {
  const { data: presets } = usePayRatePresets()
  const [isOpen, setIsOpen] = useState(false)
  const { format } = useCurrency()

  return (
    <Card title="已建立的預設費率">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="text-xs text-glaucous dark:text-wisteria"
      >
        {isOpen ? '收起 ▲' : `展開查看(${presets?.length ?? 0} 筆) ▼`}
      </button>
      {isOpen && (
        <div className="mt-3 flex flex-col">
          {presets?.length === 0 && (
            <p className="text-sm text-gray-500">
              還沒有預設費率,設定工作的薪資規則時選「使用預設費率」可以直接在那邊新增
            </p>
          )}
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
      )}
    </Card>
  )
}

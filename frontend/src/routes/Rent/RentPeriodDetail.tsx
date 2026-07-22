import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useCurrency } from '../../contexts/CurrencyContext'
import {
  useCreateRentPayment,
  useDeleteRentPayment,
  useDeleteRentPeriod,
  useRentPayments,
  useUpdateRentPeriod,
} from '../../hooks/useRentPeriods'
import type { RentPaymentCreate, RentPeriod, RentPeriodUpdate } from '../../types/api'
import { CYCLE_PRESETS } from './cyclePresets'

export function RentPeriodDetail({
  period,
  onClose,
}: {
  period: RentPeriod
  onClose: () => void
}) {
  const [showEdit, setShowEdit] = useState(false)
  const { data: payments } = useRentPayments(period.id)
  const updatePeriod = useUpdateRentPeriod(period.id)
  const deletePeriod = useDeleteRentPeriod()
  const createPayment = useCreateRentPayment(period.id)
  const deletePayment = useDeleteRentPayment(period.id)

  const { format } = useCurrency()
  const editForm = useForm<RentPeriodUpdate>({ defaultValues: period })
  const paymentForm = useForm<RentPaymentCreate>({
    defaultValues: { due_date: period.start_date, paid_date: new Date().toISOString().slice(0, 10) },
  })

  const isCustomCycle = !CYCLE_PRESETS.some((p) => p.days === period.cycle_days)

  return (
    <Card title={`房租細節: ${period.label}`}>
      <div className="mb-4 flex gap-2">
        <Button variant="secondary" onClick={() => setShowEdit(true)}>
          編輯
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (window.confirm(`確定要刪除「${period.label}」這筆房租紀錄嗎?(繳款紀錄也會一併刪除)`)) {
              deletePeriod.mutate(period.id, { onSuccess: onClose })
            }
          }}
        >
          刪除
        </Button>
        <Button variant="secondary" onClick={onClose}>
          關閉
        </Button>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">繳款紀錄</h3>
      <div className="mb-3 flex flex-col gap-2">
        {payments?.length === 0 && <p className="text-sm text-gray-500">尚無繳款紀錄</p>}
        {payments?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-md border border-gray-200 p-2 text-xs dark:border-gray-700"
          >
            <span>
              到期日 {p.due_date} · 實付 {p.paid_date} · {format(p.amount)}
            </span>
            <button onClick={() => deletePayment.mutate(p.id)} className="text-red-500">
              取消確認
            </button>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">補登繳款紀錄</h3>
      <form
        className="grid grid-cols-2 gap-2"
        onSubmit={paymentForm.handleSubmit((values) =>
          createPayment.mutate(values, { onSuccess: () => paymentForm.reset() }),
        )}
      >
        <div>
          <label className="mb-1 block text-xs text-gray-500">到期日(哪一次的租金)</label>
          <input
            type="date"
            {...paymentForm.register('due_date', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">實際繳款日</label>
          <input
            type="date"
            {...paymentForm.register('paid_date', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <input
          {...paymentForm.register('amount', { required: true })}
          placeholder="金額"
          defaultValue={period.amount}
          className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <Button type="submit" className="col-span-2" disabled={createPayment.isPending}>
          確認已繳
        </Button>
        {createPayment.isError && (
          <p className="col-span-2 text-xs text-red-600">
            {(createPayment.error as Error).message}
          </p>
        )}
      </form>

      {showEdit && (
        <Modal title="編輯房租週期" onClose={() => setShowEdit(false)}>
          <form
            className="flex flex-col gap-3"
            onSubmit={editForm.handleSubmit((values) =>
              updatePeriod.mutate(values, { onSuccess: () => setShowEdit(false) }),
            )}
          >
            <input
              {...editForm.register('label', { required: true })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              {...editForm.register('amount', { required: true })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <div>
              <label className="mb-1 block text-xs text-gray-500">週期天數</label>
              <input
                type="number"
                {...editForm.register('cycle_days', { required: true, valueAsNumber: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
              {isCustomCycle && (
                <p className="mt-1 text-xs text-gray-500">
                  目前是自訂天數({period.cycle_days} 天),可直接改數字
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">開始日期</label>
              <input
                type="date"
                {...editForm.register('start_date', { required: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                結束日期(搬家/退租時填,不然留空)
              </label>
              <input
                type="date"
                {...editForm.register('end_date')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <Button type="submit" disabled={updatePeriod.isPending}>
              儲存變更
            </Button>
          </form>
        </Modal>
      )}
    </Card>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useCreateJob, useJobs } from '../../hooks/useJobs'
import type { JobCreate } from '../../types/api'
import { JobPayRulesSection } from './JobPayRulesSection'
import { PayRatePresetsSection } from './PayRatePresetsSection'

const jobSchema = z.object({
  name: z.string().min(1, '請輸入工作名稱'),
  employer_type: z.enum(['award', 'cash']),
  state: z.string().min(2, '請輸入州別,如 NSW'),
})

export function JobsPage() {
  const { data: jobs, isLoading } = useJobs()
  const createJob = useCreateJob()
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobCreate>({
    resolver: zodResolver(jobSchema),
    defaultValues: { employer_type: 'award', state: 'NSW' },
  })

  const selectedJob = jobs?.find((job) => job.id === selectedJobId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">工作管理</h1>
      <p className="-mt-4 text-xs text-gray-500">
        步驟:① 新增工作 → ② 點下面列表選一份工作 → ③ 設定那份工作的薪資規則
      </p>

      <Card title="① 工作列表">
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        {jobs?.length === 0 && !isLoading && (
          <p className="text-sm text-gray-500">還沒有工作,先在下面新增一個</p>
        )}
        <div className="flex flex-col">
          {jobs?.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
              className={`border-b border-gray-100 px-2 py-3 text-left text-sm last:border-b-0 dark:border-gray-700/50 ${
                selectedJobId === job.id ? 'bg-wisteria/15 dark:bg-glaucous/20' : ''
              }`}
            >
              <span className="font-medium">{job.name}</span>{' '}
              <span className="text-xs text-gray-500">
                ({job.employer_type === 'cash' ? '現金' : 'Award'} · {job.state})
              </span>
              {selectedJobId === job.id && (
                <span className="ml-1 text-xs text-glaucous dark:text-wisteria">← 設定薪資規則在下面 ↓</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {selectedJob && <JobPayRulesSection jobId={selectedJob.id} jobName={selectedJob.name} />}

      <Card title="新增工作">
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit((values) => {
            createJob.mutate(values, { onSuccess: () => reset() })
          })}
        >
          <div>
            <label className="mb-1 block text-xs text-gray-500">工作名稱</label>
            <input
              {...register('name')}
              placeholder="例如 Cafe A"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">薪資類型</label>
              <select
                {...register('employer_type')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="award">Award(照官方費率,如咖啡廳)</option>
                <option value="cash">現金(不算稅,自己談的價錢)</option>
              </select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs text-gray-500">州別</label>
              <input
                {...register('state')}
                placeholder="如 NSW"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
          </div>
          <Button type="submit" disabled={createJob.isPending}>
            新增工作
          </Button>
        </form>
      </Card>

      <PayRatePresetsSection />
    </div>
  )
}

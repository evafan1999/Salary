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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">工作管理</h1>

      <Card title="新增工作">
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit((values) => {
            createJob.mutate(values, { onSuccess: () => reset() })
          })}
        >
          <input
            {...register('name')}
            placeholder="工作名稱,如 Cafe A"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          <div className="flex gap-3">
            <select
              {...register('employer_type')}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="award">Award(咖啡廳等)</option>
              <option value="cash">現金(不算稅)</option>
            </select>
            <input
              {...register('state')}
              placeholder="州別,如 NSW"
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <Button type="submit" disabled={createJob.isPending}>
            新增工作
          </Button>
        </form>
      </Card>

      <PayRatePresetsSection />

      <Card title="工作列表">
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        <div className="flex flex-col gap-2">
          {jobs?.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                selectedJobId === job.id
                  ? 'border-glaucous bg-wisteria/15 dark:bg-glaucous/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="font-medium">{job.name}</span>{' '}
              <span className="text-xs text-gray-500">
                ({job.employer_type === 'cash' ? '現金' : 'Award'} · {job.state})
              </span>
            </button>
          ))}
        </div>
      </Card>

      {selectedJobId && <JobPayRulesSection jobId={selectedJobId} />}
    </div>
  )
}

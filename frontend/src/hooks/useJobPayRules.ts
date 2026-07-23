import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { JobPayRule, JobPayRuleCreate, JobPayRuleUpdate } from '../types/api'

export function useJobPayRules(jobId: number) {
  return useQuery({
    queryKey: queryKeys.jobPayRules(jobId),
    queryFn: () => apiClient.get<JobPayRule[]>(`/api/v1/jobs/${jobId}/pay-rules`),
    enabled: jobId > 0,
  })
}

export function useCreateJobPayRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, payload }: { jobId: number; payload: JobPayRuleCreate }) =>
      apiClient.post<JobPayRule>(`/api/v1/jobs/${jobId}/pay-rules`, payload),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPayRules(jobId) })
    },
  })
}

export function useUpdateJobPayRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: number; payload: JobPayRuleUpdate }) =>
      apiClient.patch<JobPayRule>(`/api/v1/pay-rules/${ruleId}`, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPayRules(data.job_id) })
    },
  })
}

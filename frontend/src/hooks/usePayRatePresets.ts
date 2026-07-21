import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { JobPayRule, JobPayRuleCreate, PayRatePreset, PayRatePresetCreate } from '../types/api'

export function usePayRatePresets() {
  return useQuery({
    queryKey: queryKeys.payRatePresets,
    queryFn: () => apiClient.get<PayRatePreset[]>('/api/v1/pay-rate-presets'),
  })
}

export function useCreatePayRatePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PayRatePresetCreate) =>
      apiClient.post<PayRatePreset>('/api/v1/pay-rate-presets', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payRatePresets }),
  })
}

export function useJobPayRules(jobId: number) {
  return useQuery({
    queryKey: queryKeys.jobPayRules(jobId),
    queryFn: () => apiClient.get<JobPayRule[]>(`/api/v1/jobs/${jobId}/pay-rules`),
    enabled: Number.isFinite(jobId),
  })
}

export function useCreateJobPayRule(jobId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: JobPayRuleCreate) =>
      apiClient.post<JobPayRule>(`/api/v1/jobs/${jobId}/pay-rules`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobPayRules(jobId) }),
  })
}

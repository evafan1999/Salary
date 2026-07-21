import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { Job, JobCreate } from '../types/api'

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => apiClient.get<Job[]>('/api/v1/jobs'),
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: JobCreate) => apiClient.post<Job>('/api/v1/jobs', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs }),
  })
}

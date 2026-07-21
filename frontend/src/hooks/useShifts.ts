import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { Shift, ShiftCreate } from '../types/api'

export function useShifts(filters?: { start_date?: string; end_date?: string; job_id?: number }) {
  const params = new URLSearchParams()
  if (filters?.start_date) params.set('start_date', filters.start_date)
  if (filters?.end_date) params.set('end_date', filters.end_date)
  if (filters?.job_id) params.set('job_id', String(filters.job_id))
  const query = params.toString()

  return useQuery({
    queryKey: queryKeys.shifts(filters),
    queryFn: () => apiClient.get<Shift[]>(`/api/v1/shifts${query ? `?${query}` : ''}`),
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShiftCreate) => apiClient.post<Shift>('/api/v1/shifts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (shiftId: number) => apiClient.delete<void>(`/api/v1/shifts/${shiftId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { ExtraIncome, ExtraIncomeCreate, ExtraIncomeUpdate } from '../types/api'

export function useExtraIncome(filters?: { start_date?: string; end_date?: string }) {
  const params = new URLSearchParams()
  if (filters?.start_date) params.set('start_date', filters.start_date)
  if (filters?.end_date) params.set('end_date', filters.end_date)
  const query = params.toString()

  return useQuery({
    queryKey: queryKeys.extraIncome(filters),
    queryFn: () => apiClient.get<ExtraIncome[]>(`/api/v1/extra-income${query ? `?${query}` : ''}`),
  })
}

export function useCreateExtraIncome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExtraIncomeCreate) =>
      apiClient.post<ExtraIncome>('/api/v1/extra-income', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-income'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

export function useUpdateExtraIncome(incomeId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExtraIncomeUpdate) =>
      apiClient.patch<ExtraIncome>(`/api/v1/extra-income/${incomeId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-income'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

export function useDeleteExtraIncome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (incomeId: number) => apiClient.delete<void>(`/api/v1/extra-income/${incomeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-income'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

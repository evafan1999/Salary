import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { SavingsGoal, SavingsGoalCreate } from '../types/api'

export function useSavingsGoal() {
  return useQuery({
    queryKey: queryKeys.savingsGoal,
    queryFn: () => apiClient.get<SavingsGoal | null>('/api/v1/savings-goal'),
  })
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SavingsGoalCreate) =>
      apiClient.post<SavingsGoal>('/api/v1/savings-goal', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../types/api'

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: () => apiClient.get<Expense[]>('/api/v1/expenses'),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExpenseCreate) => apiClient.post<Expense>('/api/v1/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

export function useUpdateExpense(expenseId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExpenseUpdate) =>
      apiClient.patch<Expense>(`/api/v1/expenses/${expenseId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (expenseId: number) => apiClient.delete<void>(`/api/v1/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

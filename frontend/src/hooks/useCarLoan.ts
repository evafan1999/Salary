import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { CarLoan, CarLoanCreate, CarLoanPayment, CarLoanPaymentCreate } from '../types/api'

export function useCarLoans() {
  return useQuery({
    queryKey: queryKeys.carLoans,
    queryFn: () => apiClient.get<CarLoan[]>('/api/v1/car-loans'),
  })
}

export function useCreateCarLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CarLoanCreate) => apiClient.post<CarLoan>('/api/v1/car-loans', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carLoans })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary })
    },
  })
}

export function useCarLoanPayments(loanId: number) {
  return useQuery({
    queryKey: queryKeys.carLoanPayments(loanId),
    queryFn: () => apiClient.get<CarLoanPayment[]>(`/api/v1/car-loans/${loanId}/payments`),
    enabled: Number.isFinite(loanId),
  })
}

export function useCreateCarLoanPayment(loanId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CarLoanPaymentCreate) =>
      apiClient.post<CarLoanPayment>(`/api/v1/car-loans/${loanId}/payments`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carLoanPayments(loanId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.carLoans })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type {
  RentPayment,
  RentPaymentCreate,
  RentPeriod,
  RentPeriodCreate,
  RentPeriodUpdate,
  UpcomingRentDue,
} from '../types/api'

export function useRentPeriods() {
  return useQuery({
    queryKey: queryKeys.rentPeriods,
    queryFn: () => apiClient.get<RentPeriod[]>('/api/v1/rent-periods'),
  })
}

export function useUpcomingRent() {
  return useQuery({
    queryKey: queryKeys.upcomingRent,
    queryFn: () => apiClient.get<UpcomingRentDue[]>('/api/v1/rent-periods/upcoming'),
  })
}

function invalidateRentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.rentPeriods })
  queryClient.invalidateQueries({ queryKey: queryKeys.upcomingRent })
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary })
  queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoal })
}

export function useCreateRentPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RentPeriodCreate) =>
      apiClient.post<RentPeriod>('/api/v1/rent-periods', payload),
    onSuccess: () => invalidateRentQueries(queryClient),
  })
}

export function useUpdateRentPeriod(periodId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RentPeriodUpdate) =>
      apiClient.patch<RentPeriod>(`/api/v1/rent-periods/${periodId}`, payload),
    onSuccess: () => invalidateRentQueries(queryClient),
  })
}

export function useDeleteRentPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (periodId: number) =>
      apiClient.delete<void>(`/api/v1/rent-periods/${periodId}`),
    onSuccess: () => invalidateRentQueries(queryClient),
  })
}

export function useRentPayments(periodId: number) {
  return useQuery({
    queryKey: queryKeys.rentPayments(periodId),
    queryFn: () => apiClient.get<RentPayment[]>(`/api/v1/rent-periods/${periodId}/payments`),
    enabled: Number.isFinite(periodId),
  })
}

export function useCreateRentPayment(periodId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RentPaymentCreate) =>
      apiClient.post<RentPayment>(`/api/v1/rent-periods/${periodId}/payments`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rentPayments(periodId) })
      invalidateRentQueries(queryClient)
    },
  })
}

export function useDeleteRentPayment(periodId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: number) =>
      apiClient.delete<void>(`/api/v1/rent-periods/payments/${paymentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rentPayments(periodId) })
      invalidateRentQueries(queryClient)
    },
  })
}

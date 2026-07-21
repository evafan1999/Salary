import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { RentPeriod, RentPeriodCreate, UpcomingRentDue } from '../types/api'

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

export function useCreateRentPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RentPeriodCreate) =>
      apiClient.post<RentPeriod>('/api/v1/rent-periods', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rentPeriods })
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingRent })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary })
    },
  })
}

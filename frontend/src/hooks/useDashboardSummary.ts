import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { queryKeys } from '../lib/queryKeys'
import type { DashboardSummary } from '../types/api'

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => apiClient.get<DashboardSummary>('/api/v1/dashboard/summary'),
  })
}

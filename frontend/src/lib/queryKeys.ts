export const queryKeys = {
  jobs: ['jobs'] as const,
  payRatePresets: ['pay-rate-presets'] as const,
  jobPayRules: (jobId: number) => ['jobs', jobId, 'pay-rules'] as const,
  shifts: (filters?: { start_date?: string; end_date?: string; job_id?: number }) =>
    ['shifts', filters ?? {}] as const,
  rentPeriods: ['rent-periods'] as const,
  upcomingRent: ['rent-periods', 'upcoming'] as const,
  rentPayments: (periodId: number) => ['rent-periods', periodId, 'payments'] as const,
  carLoans: ['car-loans'] as const,
  carLoanPayments: (loanId: number) => ['car-loans', loanId, 'payments'] as const,
  expenses: ['expenses'] as const,
  savingsGoal: ['savings-goal'] as const,
  dashboardSummary: ['dashboard', 'summary'] as const,
}

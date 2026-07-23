export type DayType = 'weekday' | 'saturday' | 'sunday' | 'public_holiday'
export type RuleType = 'preset' | 'custom'

export interface Job {
  id: number
  name: string
  employer_type: 'award' | 'cash'
  state: string
  is_active: boolean
  notes: string | null
}

export interface JobCreate {
  name: string
  employer_type: 'award' | 'cash'
  state: string
  notes?: string | null
}

export interface JobUpdate {
  name?: string
  employer_type?: 'award' | 'cash'
  state?: string
  is_active?: boolean
  notes?: string | null
}

export interface PayRatePreset {
  id: number
  name: string
  award_reference: string | null
  base_hourly_rate: string
  saturday_rate: string
  sunday_rate: string
  public_holiday_rate: string
  casual_loading_pct: string | null
  effective_from: string
  effective_to: string | null
}

export interface PayRatePresetCreate {
  name: string
  award_reference?: string | null
  base_hourly_rate: string
  saturday_rate: string
  sunday_rate: string
  public_holiday_rate: string
  casual_loading_pct?: string | null
  effective_from: string
  effective_to?: string | null
}

export interface JobPayRule {
  id: number
  job_id: number
  rule_type: RuleType
  preset_id: number | null
  custom_weekday_rate: string | null
  custom_saturday_rate: string | null
  custom_sunday_rate: string | null
  custom_public_holiday_rate: string | null
  effective_from: string
  effective_to: string | null
}

export interface JobPayRuleCreate {
  rule_type: RuleType
  preset_id?: number | null
  custom_weekday_rate?: string | null
  custom_saturday_rate?: string | null
  custom_sunday_rate?: string | null
  custom_public_holiday_rate?: string | null
  effective_from: string
  effective_to?: string | null
}

export interface JobPayRuleUpdate {
  rule_type?: RuleType
  preset_id?: number | null
  custom_weekday_rate?: string | null
  custom_saturday_rate?: string | null
  custom_sunday_rate?: string | null
  custom_public_holiday_rate?: string | null
  effective_from?: string
  effective_to?: string | null
}

export interface Shift {
  id: number
  job_id: number
  shift_date: string
  start_time: string
  end_time: string
  crosses_midnight: boolean
  unpaid_break_minutes: number
  day_type_override: DayType | null
  notes: string | null
  worked_hours: string
  resolved_day_type: DayType
  gross_pay: string
}

export interface ShiftCreate {
  job_id: number
  shift_date: string
  start_time: string
  end_time: string
  crosses_midnight?: boolean
  unpaid_break_minutes?: number
  day_type_override?: DayType | null
  notes?: string | null
}

export interface RentPeriod {
  id: number
  label: string
  amount: string
  cycle_days: number
  start_date: string
  end_date: string | null
  deposit_amount: string | null
  notes: string | null
}

export interface RentPeriodCreate {
  label: string
  amount: string
  cycle_days: number
  start_date: string
  end_date?: string | null
  deposit_amount?: string | null
  notes?: string | null
}

export interface RentPeriodUpdate {
  label?: string
  amount?: string
  cycle_days?: number
  start_date?: string
  end_date?: string | null
  deposit_amount?: string | null
  notes?: string | null
}

export interface UpcomingRentDue {
  rent_period_id: number
  label: string
  amount: string
  due_date: string
  is_overdue: boolean
}

export interface RentPayment {
  id: number
  rent_period_id: number
  due_date: string
  paid_date: string
  amount: string
  notes: string | null
}

export interface RentPaymentCreate {
  due_date: string
  paid_date: string
  amount: string
  notes?: string | null
}

export interface CarLoan {
  id: number
  description: string
  total_amount: string
  start_date: string
  notes: string | null
  paid_to_date: string
  remaining_balance: string
}

export interface CarLoanCreate {
  description: string
  total_amount: string
  start_date: string
  notes?: string | null
}

export interface CarLoanUpdate {
  description?: string
  total_amount?: string
  start_date?: string
  notes?: string | null
}

export interface CarLoanPayment {
  id: number
  car_loan_id: number
  payment_date: string
  amount: string
  notes: string | null
}

export interface CarLoanPaymentCreate {
  payment_date: string
  amount: string
  notes?: string | null
}

export interface CarLoanPaymentUpdate {
  payment_date?: string
  amount?: string
  notes?: string | null
}

export interface Expense {
  id: number
  description: string
  amount: string
  expense_date: string
  notes: string | null
}

export interface ExpenseCreate {
  description: string
  amount: string
  expense_date: string
  notes?: string | null
}

export interface ExpenseUpdate {
  description?: string
  amount?: string
  expense_date?: string
  notes?: string | null
}

export interface SavingsGoal {
  id: number
  target_amount: string
  target_date: string
  starting_balance: string
  tracking_start_date: string
  is_active: boolean
  notes: string | null
  net_saved_so_far: string
  weeks_remaining: string
  required_weekly_savings: string
}

export interface SavingsGoalCreate {
  target_amount: string
  target_date: string
  starting_balance?: string
  tracking_start_date: string
  notes?: string | null
}

export interface JobEarnings {
  job_id: number
  job_name: string
  gross_pay: string
}

export interface DashboardSummary {
  current_period_start: string
  current_period_end: string
  earnings_by_job: JobEarnings[]
  total_current_period_earnings: string
  upcoming_rent: UpcomingRentDue[]
  car_loans: CarLoan[]
  savings_goal: SavingsGoal | null
}

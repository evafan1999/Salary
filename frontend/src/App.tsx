import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './routes/Dashboard/DashboardPage'
import { ShiftsWeeklyPage } from './routes/Shifts/ShiftsWeeklyPage'
import { JobsPage } from './routes/Jobs/JobsPage'
import { RentPage } from './routes/Rent/RentPage'
import { CarLoanPage } from './routes/CarLoan/CarLoanPage'
import { SavingsGoalPage } from './routes/SavingsGoal/SavingsGoalPage'

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/shifts" element={<ShiftsWeeklyPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/rent" element={<RentPage />} />
          <Route path="/car-loan" element={<CarLoanPage />} />
          <Route path="/savings-goal" element={<SavingsGoalPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App

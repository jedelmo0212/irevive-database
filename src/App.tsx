import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/context/auth-context';
import { RepairProvider } from './lib/context/repair-context';

import { DashboardLayout } from './components/layout/dashboard-layout';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import RepairsPage from './pages/repairs';
import TechniciansPage from './pages/technicians';
import UsersPage from './pages/users';
import NotFoundPage from './pages/not-found';

const App = () => (
  <AuthProvider>
    <RepairProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/repairs" element={<RepairsPage />} />
              <Route path="/technicians" element={<TechniciansPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RepairProvider>
  </AuthProvider>
);

export default App;
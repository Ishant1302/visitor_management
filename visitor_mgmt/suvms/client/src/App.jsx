import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TimeProvider } from './contexts/TimeContext';
import { useToast }   from './hooks/useToast';
import ToastContainer from './components/ui/Toast';
import { createContext, useContext } from 'react';

// Pages
import LoginPage    from './pages/public/LoginPage';
import SignupPage   from './pages/public/SignupPage';

import MyVisitorsPage    from './pages/member/MyVisitorsPage';
import PreRegisterPage   from './pages/member/PreRegisterPage';
import NotificationsPage from './pages/member/NotificationsPage';

import GuardDashboardPage  from './pages/guard/GuardDashboardPage';
import WalkInPage          from './pages/guard/WalkInPage';
import VisitorRecordsPage  from './pages/guard/VisitorRecordsPage';
import VisitDetailPage     from './pages/guard/VisitDetailPage';

import AdminOverviewPage        from './pages/admin/AdminOverviewPage';
import AdminVisitorRecordsPage  from './pages/admin/AdminVisitorRecordsPage';
import AdminUserManagementPage  from './pages/admin/AdminUserManagementPage';
import AdminBlacklistPage       from './pages/admin/AdminBlacklistPage';

// ── Toast Context ────────────────────────────────────────────────────────────
export const ToastContext = createContext(null);
export function useToastContext() { return useContext(ToastContext); }

// ── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home based on role
    const home = { member: '/member/visitors', guard: '/guard', admin: '/admin' };
    return <Navigate to={home[user.role] || '/login'} replace />;
  }
  return children;
}

// ── Root redirect — sends logged-in users to their home ─────────────────────
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const home = { member: '/member/visitors', guard: '/guard', admin: '/admin' };
  return <Navigate to={home[user.role] || '/login'} replace />;
}

// ── App Inner (has auth context) ─────────────────────────────────────────────
function AppInner() {
  const { toasts, showToast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Member */}
        <Route path="/member/visitors" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MyVisitorsPage />
          </ProtectedRoute>
        } />
        <Route path="/member/pre-register" element={
          <ProtectedRoute allowedRoles={['member']}>
            <PreRegisterPage />
          </ProtectedRoute>
        } />
        <Route path="/member/notifications" element={
          <ProtectedRoute allowedRoles={['member']}>
            <NotificationsPage />
          </ProtectedRoute>
        } />

        {/* Guard */}
        <Route path="/guard" element={
          <ProtectedRoute allowedRoles={['guard']}>
            <GuardDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/guard/walkin" element={
          <ProtectedRoute allowedRoles={['guard']}>
            <WalkInPage />
          </ProtectedRoute>
        } />
        <Route path="/guard/records" element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <VisitorRecordsPage />
          </ProtectedRoute>
        } />
        <Route path="/guard/visit/:id" element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <VisitDetailPage />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOverviewPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/records" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVisitorRecordsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUserManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/blacklist" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBlacklistPage />
          </ProtectedRoute>
        } />

        {/* Root + catch-all */}
        <Route path="/"   element={<RootRedirect />} />
        <Route path="*"   element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimeProvider>
          <AppInner />
        </TimeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

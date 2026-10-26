import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ToastContainer from './components/ui/ToastContainer';

// Pages
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';

// Guard pages
import GuardDashboard from './pages/guard/Dashboard';

// Member pages
import MemberDashboard from './pages/member/Dashboard';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/UserManagement';

// Shared pages
import VisitorRecords from './pages/shared/VisitorRecords';

import './index.css';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role.toLowerCase()}`} replace /> : <LandingPage />} />
      <Route path="/login/:role" element={<LoginPage />} />

      {/* Guard */}
      <Route path="/guard" element={<ProtectedRoute roles={['GUARD']}><GuardDashboard /></ProtectedRoute>} />
      <Route path="/guard/records" element={<ProtectedRoute roles={['GUARD']}><VisitorRecords /></ProtectedRoute>} />

      {/* Member */}
      <Route path="/member" element={<ProtectedRoute roles={['MEMBER']}><MemberDashboard /></ProtectedRoute>} />
      <Route path="/member/records" element={<ProtectedRoute roles={['MEMBER']}><VisitorRecords /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/records" element={<ProtectedRoute roles={['ADMIN']}><VisitorRecords /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

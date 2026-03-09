import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-load dashboards for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard'));
const WardenDashboard = lazy(() => import('./pages/dashboards/WardenDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard'));
const MaintenanceDashboard = lazy(() => import('./pages/dashboards/MaintenanceDashboard'));

// ── Loading fallback ──────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontSize: '0.9rem' }}>
    Loading…
  </div>
);

// ── Route guards ──────────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
};

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// ── Role → Dashboard mapping ──────────────────────────────────────────────────
const RoleDashboard = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'warden': return <WardenDashboard />;
    case 'maintenance': return <MaintenanceDashboard />;
    default: return <StudentDashboard />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' } }} />
      <Router>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><RoleDashboard /></PrivateRoute>} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

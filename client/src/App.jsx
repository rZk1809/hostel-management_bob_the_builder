import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const Login    = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const StudentDashboard     = lazy(() => import('./pages/dashboards/StudentDashboard'));
const WardenDashboard      = lazy(() => import('./pages/dashboards/WardenDashboard'));
const AdminDashboard       = lazy(() => import('./pages/dashboards/AdminDashboard'));
const MaintenanceDashboard = lazy(() => import('./pages/dashboards/MaintenanceDashboard'));

const Spinner = () => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: '0.75rem',
    }}>
        <div style={{
            width: 20, height: 20,
            border: '2px solid var(--border)',
            borderTop: '2px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

const PublicRoute  = ({ children }) => { const { user } = useAuth(); return user ? <Navigate to="/" replace /> : children; };
const PrivateRoute = ({ children }) => { const { user } = useAuth(); return user ? children : <Navigate to="/login" replace />; };

const RoleDashboard = () => {
    const { user } = useAuth();
    switch (user?.role) {
        case 'admin':       return <AdminDashboard />;
        case 'warden':      return <WardenDashboard />;
        case 'maintenance': return <MaintenanceDashboard />;
        default:            return <StudentDashboard />;
    }
};

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            padding: '10px 14px',
                            boxShadow: 'var(--shadow)',
                        },
                        success: { iconTheme: { primary: '#22c55e', secondary: 'transparent' } },
                        error:   { iconTheme: { primary: '#ef4444', secondary: 'transparent' } },
                    }}
                />
                <Router>
                    <Suspense fallback={<Spinner />}>
                        <Routes>
                            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
                            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                            <Route path="/"         element={<PrivateRoute><RoleDashboard /></PrivateRoute>} />
                            <Route path="*"         element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

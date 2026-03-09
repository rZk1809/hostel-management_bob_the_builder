import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authShell}>
            {/* Left branding panel */}
            <div className={styles.leftPanel}>
                <div className={styles.leftLogo}>
                    <div className={styles.leftLogoIcon}><Home size={16} /></div>
                    <span className={styles.leftLogoName}>HostelDesk</span>
                </div>
                <h2 className={styles.leftHeadline}>Manage hostel complaints,<br />seamlessly.</h2>
                <p className={styles.leftSub}>
                    A unified platform for students, wardens, and maintenance teams to track and resolve hostel issues efficiently.
                </p>
                <div className={styles.featureList}>
                    {['Role-based access control', 'Real-time complaint tracking', 'Image attachments & comments', 'Analytics for wardens & admins'].map(f => (
                        <div key={f} className={styles.featureItem}>
                            <div className={styles.featureDot} />
                            {f}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right form panel */}
            <div className={styles.rightPanel}>
                <div className={styles.authCard}>
                    {/* Mobile-only logo */}
                    <div className={styles.mobileLogo}>
                        <div className={styles.mobileLogoIcon}><Home size={14} /></div>
                        <span className={styles.mobileLogoName}>HostelDesk</span>
                    </div>

                    <div className={styles.formHeader}>
                        <h1 className={styles.formTitle}>Welcome back</h1>
                        <p className={styles.formSubtitle}>Sign in to your account to continue</p>
                    </div>

                    {error && (
                        <div className={styles.error} style={{ marginBottom: '1rem' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email address</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@college.edu"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Password</label>
                            <div className={styles.passwordWrap}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className={styles.input}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPw(s => !s)}
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p className={styles.switchText}>
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

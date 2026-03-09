import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', roomNumber: '' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
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
                <h2 className={styles.leftHeadline}>Your hostel issues,<br />handled fast.</h2>
                <p className={styles.leftSub}>
                    Create an account to start filing and tracking complaints. Wardens and maintenance staff will be notified instantly.
                </p>
                <div className={styles.featureList}>
                    {['Submit complaints with images', 'Track resolution progress', 'Comment on open issues', 'Get notified on updates'].map(f => (
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
                        <h1 className={styles.formTitle}>Create an account</h1>
                        <p className={styles.formSubtitle}>Get started with HostelDesk in seconds</p>
                    </div>

                    {error && (
                        <div className={styles.error} style={{ marginBottom: '1rem' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.name}
                                onChange={set('name')}
                                placeholder="Your full name"
                                required
                                autoComplete="name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email address</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={form.email}
                                onChange={set('email')}
                                placeholder="you@college.edu"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Room number</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={form.roomNumber}
                                onChange={set('roomNumber')}
                                placeholder="e.g. A-204"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Password</label>
                            <div className={styles.passwordWrap}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className={styles.input}
                                    value={form.password}
                                    onChange={set('password')}
                                    placeholder="Minimum 6 characters"
                                    required
                                    autoComplete="new-password"
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
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <p className={styles.switchText}>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

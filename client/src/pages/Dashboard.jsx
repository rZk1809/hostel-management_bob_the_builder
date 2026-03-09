import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import StatsBar from '../components/StatsBar';
import FilterBar from '../components/FilterBar';
import ComplaintList from '../components/ComplaintList';
import ComplaintForm from '../components/ComplaintForm';
import ComplaintDetail from '../components/ComplaintDetail';
import { useAuth } from '../context/AuthContext';
import styles from '../App.module.css';

export default function Dashboard() {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
    const [view, setView] = useState('list'); // 'list' | 'new' | 'detail'
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, s] = await Promise.all([api.getComplaints(filters), api.getStats()]);
            // New API returns { complaints: [], pagination: {} }
            setComplaints(res.complaints ?? res); // fallback to array for compat
            setStats(s);
        } catch (e) {
            console.error(e);
            if (e.status === 401 || (e.message && e.message.toLowerCase().includes('not authorized'))) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, [filters, logout]);

    useEffect(() => { loadData(); }, [loadData]);

    const openDetail = (c) => { setSelected(c); setView('detail'); };
    const goBack = () => { setSelected(null); setView('list'); loadData(); };

    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🏠</span>
                    <div>
                        <div className={styles.logoTitle}>HostelDesk</div>
                        <div className={styles.logoSub}>Complaint Management</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        Logged in as <b>{user?.name}</b>
                    </div>
                    {view === 'list' ? (
                        <button className={styles.btnPrimary} onClick={() => setView('new')}>
                            + New Complaint
                        </button>
                    ) : (
                        <button className={styles.btnGhost} onClick={goBack}>← Back</button>
                    )}
                    <button className={styles.btnGhost} onClick={logout} style={{ color: 'var(--danger-color)' }}>Logout</button>
                </div>
            </header>

            <main className={styles.main}>
                {view === 'list' && (
                    <>
                        {stats && <StatsBar stats={stats} />}
                        <FilterBar filters={filters} setFilters={setFilters} />
                        <ComplaintList
                            complaints={complaints}
                            loading={loading}
                            onSelect={openDetail}
                            onRefresh={loadData}
                        />
                    </>
                )}
                {view === 'new' && (
                    <ComplaintForm
                        onSuccess={() => { setView('list'); loadData(); }}
                        onCancel={() => setView('list')}
                    />
                )}
                {view === 'detail' && selected && (
                    <ComplaintDetail
                        complaint={selected}
                        onUpdate={loadData}
                        onDelete={goBack}
                    />
                )}
            </main>
        </div>
    );
}

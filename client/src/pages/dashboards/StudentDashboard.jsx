import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AppLayout from '../../layouts/AppLayout';
import ComplaintForm from '../../components/ComplaintForm';
import ComplaintDetail from '../../components/ComplaintDetail';
import Pagination from '../../components/Pagination';
import { STATUS_COLORS, PRIORITY_COLORS, CATEGORY_ICONS, fmtDate } from '../../utils';
import s from '../../styles/dashboard.module.css';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [page, setPage] = useState('my-complaints');
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', category: '' });
    const [pageNum, setPageNum] = useState(1);
    const [pagination, setPagination] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [r, st] = await Promise.all([api.getComplaints(filter, pageNum), api.getStats()]);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
            setStats(st);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [filter, pageNum]);

    useEffect(() => { setPageNum(1); }, [filter]);
    useEffect(() => { load(); }, [load]);

    const pageTitle = { 'my-complaints': 'My Complaints', 'new-complaint': 'New Complaint', 'profile': 'My Profile' };

    return (
        <AppLayout activePage={page} onNavigate={(p) => { setPage(p); setSelected(null); }} title={pageTitle[page] || 'HostelDesk'}>
            {/* ── My Complaints ────────────────────────────────────────────── */}
            {page === 'my-complaints' && !selected && (
                <div className={s.page}>
                    {stats && (
                        <div className={s.statsGrid}>
                            {[
                                { label: 'Total', value: stats.total, color: 'var(--text)' },
                                { label: 'Open', value: stats.byStatus?.open || 0, color: 'var(--open)' },
                                { label: 'In Progress', value: stats.byStatus?.['in-progress'] || 0, color: 'var(--progress)' },
                                { label: 'Resolved', value: stats.byStatus?.resolved || 0, color: 'var(--resolved)' },
                            ].map(c => (
                                <div key={c.label} className={s.statCard}>
                                    <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                    <span className={s.statLabel}>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={s.filterRow}>
                        {['', 'open', 'in-progress', 'resolved'].map(v => (
                            <select key={v} className={s.filterSelect} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
                                <option value="">All Status</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        )).slice(0, 1)}
                        <select className={s.filterSelect} value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
                            <option value="">All Categories</option>
                            {['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'].map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                        <button className={s.btnPrimary} onClick={() => setPage('new-complaint')}>+ New Complaint</button>
                    </div>

                    {loading ? (
                        <div className={s.empty}><div className={s.emptyIcon}>⏳</div>Loading your complaints…</div>
                    ) : complaints.length === 0 ? (
                        <div className={s.empty}>
                            <div className={s.emptyIcon}>📭</div>
                            No complaints yet. <button className={s.btnPrimary} style={{ marginTop: '0.75rem' }} onClick={() => setPage('new-complaint')}>File your first one</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {complaints.map(c => (
                                <div key={c.id} className={s.complaintCard} onClick={() => setSelected(c)}>
                                    <div className={s.cardTopRow}>
                                        <div className={s.cardMeta}>
                                            <span>{CATEGORY_ICONS[c.category] || '📋'}</span>
                                            <span>{c.category}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span className={s.badge} style={{ background: `${PRIORITY_COLORS[c.priority]}22`, color: PRIORITY_COLORS[c.priority] }}>{c.priority}</span>
                                            <span className={s.badge} style={{ background: `${STATUS_COLORS[c.status]}22`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
                                        </div>
                                    </div>
                                    <div className={s.cardTitle}>{c.title}</div>
                                    <div className={s.cardDesc}>{c.description}</div>
                                    <div className={s.cardFooter}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{fmtDate(c.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                            <Pagination pagination={pagination} onPageChange={setPageNum} />
                        </div>
                    )}
                </div>
            )}

            {page === 'my-complaints' && selected && (
                <ComplaintDetail
                    complaint={selected}
                    onUpdate={load}
                    onDelete={() => { setSelected(null); load(); }}
                    onBack={() => setSelected(null)}
                />
            )}

            {/* ── New Complaint ─────────────────────────────────────────────── */}
            {page === 'new-complaint' && (
                <ComplaintForm
                    onSuccess={() => { toast.success('Complaint submitted successfully!'); setPage('my-complaints'); load(); }}
                    onCancel={() => setPage('my-complaints')}
                />
            )}

            {/* ── Profile ──────────────────────────────────────────────────── */}
            {page === 'profile' && (
                <div className={s.page}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '2rem', maxWidth: '480px' }}>
                        <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>👤</div>
                        {[
                            { label: 'Full Name', value: user?.name },
                            { label: 'Email', value: user?.email },
                            { label: 'Role', value: user?.role },
                            { label: 'Room Number', value: user?.roomNumber || 'Not assigned' },
                        ].map(f => (
                            <div key={f.label} style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{f.label}</div>
                                <div style={{ color: 'var(--text)', fontWeight: 500 }}>{f.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

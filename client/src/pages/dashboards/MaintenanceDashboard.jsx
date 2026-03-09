import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AppLayout from '../../layouts/AppLayout';
import Pagination from '../../components/Pagination';
import Comments from '../../components/Comments';
import ComplaintImages from '../../components/ComplaintImages';
import { STATUS_COLORS, CATEGORY_ICONS, fmtDate } from '../../utils';
import s from '../../styles/dashboard.module.css';

export default function MaintenanceDashboard() {
    const { user } = useAuth();
    const [page, setPage] = useState('assigned');
    const [complaints, setComplaints] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageNum, setPageNum] = useState(1);
    const [pagination, setPagination] = useState(null);

    const notify = (text, type = 'success') => type === 'error' ? toast.error(text) : toast.success(text);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Maintenance staff sees their own assigned complaints (server scopes to assigned user)
            const r = await api.getComplaints({}, pageNum);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [pageNum]);

    useEffect(() => { load(); }, [load]);

    const markInProgress = async (id) => {
        try { await api.updateComplaint(id, { status: 'in-progress' }); notify('✅ Status updated to In Progress.'); load(); } catch (e) { notify(e.message, 'error'); }
    };
    const markResolved = async (id) => {
        try { await api.updateComplaint(id, { status: 'resolved' }); notify('✅ Marked as resolved.'); setSelected(null); load(); } catch (e) { notify(e.message, 'error'); }
    };

    return (
        <AppLayout activePage={page} onNavigate={(p) => { setPage(p); setSelected(null); }} title={{ assigned: 'My Assigned Tasks', profile: 'My Profile' }[page]}>

            {/* ── Assigned Tasks ─────────────────────────────────────────────── */}
            {page === 'assigned' && !selected && (
                <div className={s.page}>
                    <div className={s.statsGrid}>
                        {[
                            { label: 'Total Assigned', value: complaints.length, color: 'var(--text)' },
                            { label: 'Open', value: complaints.filter(c => c.status === 'open').length, color: 'var(--open)' },
                            { label: 'In Progress', value: complaints.filter(c => c.status === 'in-progress').length, color: 'var(--progress)' },
                            { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, color: 'var(--resolved)' },
                        ].map(c => (
                            <div key={c.label} className={s.statCard}>
                                <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                <span className={s.statLabel}>{c.label}</span>
                            </div>
                        ))}
                    </div>

                    {loading ? <div className={s.empty}>⏳ Loading tasks…</div> : complaints.length === 0 ? (
                        <div className={s.empty}><div className={s.emptyIcon}>✅</div>No tasks currently assigned to you.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {complaints.map(c => (
                                <div key={c.id} className={s.complaintCard}>
                                    <div className={s.cardTopRow} onClick={() => setSelected(c)}>
                                        <div className={s.cardMeta}>
                                            <span>{CATEGORY_ICONS[c.category] || '🔧'}</span>
                                            <b>Room {c.roomNumber}</b>
                                            <span>·</span>
                                            <span>{c.category}</span>
                                        </div>
                                        <span className={s.badge} style={{ background: `${STATUS_COLORS[c.status]}22`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
                                    </div>
                                    <div className={s.cardTitle} onClick={() => setSelected(c)}>{c.title}</div>
                                    <div className={s.cardFooter}>
                                        <span style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>Assigned: {fmtDate(c.updatedAt)}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {c.status === 'open' && (
                                                <button className={s.btnGhost} style={{ padding: '3px 10px', fontSize: '0.75rem', color: 'var(--progress)', borderColor: 'var(--progress)' }} onClick={() => markInProgress(c.id)}>▶ Start</button>
                                            )}
                                            {c.status !== 'resolved' && (
                                                <button className={s.btnGhost} style={{ padding: '3px 10px', fontSize: '0.75rem', color: 'var(--resolved)', borderColor: 'var(--resolved)' }} onClick={() => markResolved(c.id)}>✓ Done</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Pagination pagination={pagination} onPageChange={setPageNum} />
                        </div>
                    )}
                </div>
            )}

            {/* ── Task Detail ────────────────────────────────────────────────── */}
            {selected && (
                <div>
                    <button className={s.btnGhost} style={{ marginBottom: '1rem' }} onClick={() => setSelected(null)}>← Back to Tasks</button>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={s.badge} style={{ background: `${STATUS_COLORS[selected.status]}22`, color: STATUS_COLORS[selected.status], padding: '5px 14px', fontSize: '0.8rem' }}>{selected.status}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Room {selected.roomNumber}</span>
                        </div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selected.title}</h2>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{CATEGORY_ICONS[selected.category]} {selected.category} · Reported {fmtDate(selected.createdAt)}</div>
                        <p style={{ lineHeight: 1.7, color: 'var(--text)' }}>{selected.description}</p>
                        <ComplaintImages images={selected.images} />
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            {selected.status === 'open' && (
                                <button className={s.btnGhost} style={{ color: 'var(--progress)', borderColor: 'var(--progress)' }} onClick={() => { markInProgress(selected.id); setSelected(p => ({ ...p, status: 'in-progress' })); }}>
                                    ▶ Mark In Progress
                                </button>
                            )}
                            {selected.status !== 'resolved' && (
                                <button className={s.btnPrimary} onClick={() => markResolved(selected.id)}>✓ Mark as Resolved</button>
                            )}
                        </div>
                        <Comments complaintId={selected.id} />
                    </div>
                </div>
            )}

            {/* ── Profile ────────────────────────────────────────────────────── */}
            {page === 'profile' && (
                <div className={s.page}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '2rem', maxWidth: '400px' }}>
                        {[
                            { label: 'Full Name', value: user?.name },
                            { label: 'Email', value: user?.email },
                            { label: 'Role', value: user?.role },
                        ].map(f => (
                            <div key={f.label} style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{f.label}</div>
                                <div style={{ color: 'var(--text)', fontWeight: 500, textTransform: 'capitalize' }}>{f.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

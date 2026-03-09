import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api';
import AppLayout from '../../layouts/AppLayout';
import Pagination from '../../components/Pagination';
import Comments from '../../components/Comments';
import ComplaintImages from '../../components/ComplaintImages';
import { STATUS_COLORS, PRIORITY_COLORS, CATEGORY_ICONS, fmtDate } from '../../utils';
import s from '../../styles/dashboard.module.css';

const STATUSES = ['', 'open', 'in-progress', 'resolved'];
const CATEGORIES = ['', 'maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'];
const PRIORITIES = ['', 'low', 'medium', 'high'];

export default function WardenDashboard() {
    const [page, setPage] = useState('all-complaints');
    const [complaints, setComplaints] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [maintenanceStaff, setMaintenanceStaff] = useState([]);
    const [filter, setFilter] = useState({ status: '', category: '', priority: '' });
    const [selected, setSelected] = useState(null);
    const [assigning, setAssigning] = useState(null);
    const [assignTo, setAssignTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [pageNum, setPageNum] = useState(1);
    const [pagination, setPagination] = useState(null);

    const notify = (text, type = 'success') => type === 'error' ? toast.error(text) : toast.success(text);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [r, a, staff] = await Promise.all([
                api.getComplaints(filter, pageNum),
                api.getAnalytics(),
                api.getUsers({ role: 'maintenance' }),
            ]);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
            setAnalytics(a);
            setMaintenanceStaff(staff.users ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filter, pageNum]);

    useEffect(() => { setPageNum(1); }, [filter]);
    useEffect(() => { load(); }, [load]);

    const handleAssign = async () => {
        try {
            await api.assignComplaint(assigning.id, { assignedTo: assignTo || null });
            notify(`✅ Complaint assigned.`);
            setAssigning(null);
            setAssignTo('');
            load();
        } catch (e) { notify(e.message, 'error'); }
    };

    const quickResolve = async (id) => {
        try {
            await api.updateComplaint(id, { status: 'resolved' });
            notify('✅ Marked as resolved.');
            load();
        } catch (e) { notify(e.message, 'error'); }
    };

    return (
        <AppLayout activePage={page} onNavigate={(p) => { setPage(p); setSelected(null); }} title="Warden Dashboard">
            {assigning && (
                <div className={s.modalOverlay}>
                    <div className={s.modal}>
                        <div className={s.modalTitle}>Assign Task</div>
                        <select className={s.input} value={assignTo} onChange={e => setAssignTo(e.target.value)}>
                            <option value="">— Unassigned —</option>
                            {maintenanceStaff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className={s.btnGhost} onClick={() => { setAssigning(null); setAssignTo(''); }}>Cancel</button>
                            <button className={s.btnPrimary} onClick={handleAssign}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {(page === 'all-complaints' || page === 'assign') && !selected && (
                <div className={s.page}>
                    {analytics && (
                        <div className={s.statsGrid}>
                            <div className={s.statCard}><span className={s.statValue}>{analytics.complaints.total}</span><span className={s.statLabel}>Total</span></div>
                            <div className={s.statCard}><span className={s.statValue} style={{ color: 'var(--open)' }}>{analytics.complaints.byStatus?.open || 0}</span><span className={s.statLabel}>Open</span></div>
                            <div className={s.statCard}><span className={s.statValue} style={{ color: 'var(--progress)' }}>{analytics.complaints.byStatus?.['in-progress'] || 0}</span><span className={s.statLabel}>In Progress</span></div>
                            <div className={s.statCard}><span className={s.statValue} style={{ color: 'var(--resolved)' }}>{analytics.complaints.byStatus?.resolved || 0}</span><span className={s.statLabel}>Resolved</span></div>
                        </div>
                    )}

                    <div className={s.filterRow}>
                        <select className={s.filterSelect} value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    {loading ? <div className={s.empty}>⏳ Loading…</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {complaints.map(c => (
                                <div key={c.id} className={s.complaintCard}>
                                    <div className={s.cardTopRow} onClick={() => setSelected(c)}>
                                        <div className={s.cardMeta}>
                                            <span>{CATEGORY_ICONS[c.category] || '📋'}</span>
                                            <span style={{ fontWeight: 600 }}>Room {c.roomNumber}</span>
                                            <span>·</span>
                                            <span>{c.studentName}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <span className={s.badge} style={{ background: `${PRIORITY_COLORS[c.priority]}22`, color: PRIORITY_COLORS[c.priority] }}>{c.priority}</span>
                                            <span className={s.badge} style={{ background: `${STATUS_COLORS[c.status]}22`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
                                        </div>
                                    </div>
                                    <div className={s.cardTitle} onClick={() => setSelected(c)}>{c.title}</div>
                                    <div className={s.cardFooter}>
                                        <span style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>{fmtDate(c.createdAt)}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className={s.btnGhost} style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => { setAssigning(c); setAssignTo(c.assignedTo || ''); }}>
                                                👷 Assign
                                            </button>
                                            {c.status !== 'resolved' && (
                                                <button className={s.btnGhost} style={{ padding: '4px 12px', fontSize: '0.75rem', color: 'var(--resolved)', borderColor: 'var(--resolved)' }} onClick={() => quickResolve(c.id)}>
                                                    ✓ Resolve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!complaints.length && <div className={s.empty}>No complaints found.</div>}
                            <Pagination pagination={pagination} onPageChange={setPageNum} />
                        </div>
                    )}
                </div>
            )}

            {selected && (
                <div>
                    <button className={s.btnGhost} style={{ marginBottom: '1rem' }} onClick={() => setSelected(null)}>← Back</button>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ background: `${STATUS_COLORS[selected.status]}22`, color: STATUS_COLORS[selected.status], padding: '4px 12px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600 }}>{selected.status}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{fmtDate(selected.createdAt)}</span>
                        </div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selected.title}</h2>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {CATEGORY_ICONS[selected.category]} {selected.category} · Room {selected.roomNumber} · {selected.studentName}
                        </div>
                        <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.65 }}>{selected.description}</p>
                        <ComplaintImages images={selected.images} />
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                            <button className={s.btnPrimary} onClick={() => { setAssigning(selected); setAssignTo(selected.assignedTo || ''); }}>👷 Assign Staff</button>
                            {selected.status !== 'resolved' && (
                                <button className={s.btnGhost} style={{ color: 'var(--resolved)', borderColor: 'var(--resolved)' }} onClick={() => { quickResolve(selected.id); setSelected(null); }}>✓ Mark Resolved</button>
                            )}
                        </div>
                        <Comments complaintId={selected.id} />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

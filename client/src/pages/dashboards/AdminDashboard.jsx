import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api';
import AppLayout from '../../layouts/AppLayout';
import Pagination from '../../components/Pagination';
import Comments from '../../components/Comments';
import ComplaintImages from '../../components/ComplaintImages';
import { STATUS_COLORS, PRIORITY_COLORS, CATEGORY_ICONS, fmtDate } from '../../utils';
import s from '../../styles/dashboard.module.css';

const ROLES = ['student', 'warden', 'admin', 'maintenance'];

export default function AdminDashboard() {
    const [page, setPage] = useState('all-complaints');
    const [complaints, setComplaints] = useState([]);
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [filter, setFilter] = useState({ status: '', category: '', priority: '' });
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageNum, setPageNum] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [roleEdit, setRoleEdit] = useState({}); // userId → newRole

    const notify = (text, type = 'success') => type === 'error' ? toast.error(text) : toast.success(text);

    const loadComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.getComplaints(filter, pageNum);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [filter, pageNum]);

    const loadAnalytics = useCallback(async () => {
        try { setAnalytics(await api.getAnalytics()); } catch (e) { console.error(e); }
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try { const r = await api.getUsers(); setUsers(r.users ?? []); } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { setPageNum(1); }, [filter]);
    useEffect(() => { if (page === 'all-complaints') { loadComplaints(); loadAnalytics(); } }, [page, loadComplaints, loadAnalytics]);
    useEffect(() => { if (page === 'analytics') loadAnalytics(); }, [page, loadAnalytics]);
    useEffect(() => { if (page === 'users') loadUsers(); }, [page, loadUsers]);

    const handleRoleUpdate = async (userId) => {
        try {
            await api.updateUserRole(userId, roleEdit[userId]);
            notify(`✅ Role updated.`);
            loadUsers();
        } catch (e) { notify(e.message, 'error'); }
    };

    const handleToggleStatus = async (userId) => {
        try {
            const res = await api.toggleUserStatus(userId);
            notify(`✅ ${res.message}`);
            loadUsers();
        } catch (e) { notify(e.message, 'error'); }
    };

    const handleResolve = async (id) => {
        try { await api.updateComplaint(id, { status: 'resolved' }); notify('✅ Resolved.'); loadComplaints(); } catch (e) { notify(e.message, 'error'); }
    };

    return (
        <AppLayout activePage={page} onNavigate={(p) => { setPage(p); setSelected(null); }} title={{ 'all-complaints': 'All Complaints', analytics: 'Analytics', users: 'User Management', profile: 'My Profile' }[page]}>

            {/* ── All Complaints ─────────────────────────────────────────────── */}
            {page === 'all-complaints' && !selected && (
                <div className={s.page}>
                    {analytics && (
                        <div className={s.statsGrid}>
                            {[
                                { label: 'Total', value: analytics.complaints.total, color: 'var(--text)' },
                                { label: 'Open', value: analytics.complaints.byStatus?.open || 0, color: 'var(--open)' },
                                { label: 'In Progress', value: analytics.complaints.byStatus?.['in-progress'] || 0, color: 'var(--progress)' },
                                { label: 'Resolved', value: analytics.complaints.byStatus?.resolved || 0, color: 'var(--resolved)' },
                            ].map(c => (
                                <div key={c.label} className={s.statCard}>
                                    <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                    <span className={s.statLabel}>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={s.filterRow}>
                        {[
                            { key: 'status', opts: ['', 'open', 'in-progress', 'resolved'] },
                            { key: 'category', opts: ['', 'maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'] },
                            { key: 'priority', opts: ['', 'low', 'medium', 'high'] },
                        ].map(f => (
                            <select key={f.key} className={s.filterSelect} value={filter[f.key]} onChange={e => setFilter(p => ({ ...p, [f.key]: e.target.value }))}>
                                {f.opts.map(o => <option key={o} value={o}>{o ? o.charAt(0).toUpperCase() + o.slice(1) : `All ${f.key}s`}</option>)}
                            </select>
                        ))}
                    </div>

                    {loading ? <div className={s.empty}>⏳ Loading…</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {complaints.map(c => (
                                <div key={c.id} className={s.complaintCard}>
                                    <div className={s.cardTopRow} onClick={() => setSelected(c)}>
                                        <div className={s.cardMeta}>
                                            <span>{CATEGORY_ICONS[c.category]}</span>
                                            <b>Room {c.roomNumber}</b>
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
                                        {c.status !== 'resolved' && (
                                            <button className={s.btnGhost} style={{ padding: '3px 10px', fontSize: '0.75rem', color: 'var(--resolved)', borderColor: 'var(--resolved)' }} onClick={() => handleResolve(c.id)}>✓ Resolve</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <Pagination pagination={pagination} onPageChange={setPageNum} />
                            {!complaints.length && <div className={s.empty}><div className={s.emptyIcon}>✅</div>No complaints found.</div>}
                        </div>
                    )}
                </div>
            )}

            {selected && page === 'all-complaints' && (
                <div>
                    <button className={s.btnGhost} style={{ marginBottom: '1rem' }} onClick={() => setSelected(null)}>← Back</button>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selected.title}</h2>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{CATEGORY_ICONS[selected.category]} {selected.category} · Room {selected.roomNumber} · {selected.studentName}</div>
                        <p style={{ lineHeight: 1.65, color: 'var(--text)' }}>{selected.description}</p>
                        <ComplaintImages images={selected.images} />
                        <Comments complaintId={selected.id} />
                    </div>
                </div>
            )}

            {/* ── Analytics ─────────────────────────────────────────────────── */}
            {page === 'analytics' && analytics && (
                <div className={s.page}>
                    <div className={s.statsGrid}>
                        {[
                            { label: 'Total Complaints', value: analytics.complaints.total, color: 'var(--text)' },
                            { label: 'Open', value: analytics.complaints.byStatus?.open || 0, color: 'var(--open)' },
                            { label: 'In Progress', value: analytics.complaints.byStatus?.['in-progress'] || 0, color: 'var(--progress)' },
                            { label: 'Resolved', value: analytics.complaints.byStatus?.resolved || 0, color: 'var(--resolved)' },
                            { label: 'Users', value: analytics.users?.total || 0, color: 'var(--accent)' },
                        ].map(c => <div key={c.label} className={s.statCard}><span className={s.statValue} style={{ color: c.color }}>{c.value}</span><span className={s.statLabel}>{c.label}</span></div>)}
                    </div>

                    <div>
                        <div className={s.sectionTitle} style={{ marginBottom: '0.75rem' }}>Users by Role</div>
                        <div className={s.statsGrid}>
                            {Object.entries(analytics.users?.byRole || {}).map(([role, count]) => (
                                <div key={role} className={s.statCard}><span className={s.statValue}>{count}</span><span className={s.statLabel}>{role}</span></div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className={s.sectionTitle} style={{ marginBottom: '0.75rem' }}>Complaints by Category</div>
                        <div className={s.statsGrid}>
                            {Object.entries(analytics.complaints.byCategory || {}).map(([cat, count]) => (
                                <div key={cat} className={s.statCard}><span className={s.statValue}>{CATEGORY_ICONS[cat]} {count}</span><span className={s.statLabel}>{cat}</span></div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className={s.sectionTitle} style={{ marginBottom: '0.75rem' }}>Last 7 Days</div>
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem' }}>
                            {analytics.complaints.last7Days?.map(d => (
                                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--muted)' }}>{d._id}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{d.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── User Management ────────────────────────────────────────────── */}
            {page === 'users' && (
                <div className={s.page}>
                    {loading ? <div className={s.empty}>⏳ Loading users…</div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className={s.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Email</th><th>Role</th><th>Room</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                                            <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{u.email}</td>
                                            <td>
                                                <select
                                                    className={s.filterSelect}
                                                    value={roleEdit[u.id] ?? u.role}
                                                    onChange={e => setRoleEdit(r => ({ ...r, [u.id]: e.target.value }))}
                                                >
                                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ color: 'var(--muted)' }}>{u.roomNumber || '—'}</td>
                                            <td>
                                                <span className={s.badge} style={{ background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: u.isActive ? 'var(--resolved)' : 'var(--danger)' }}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {roleEdit[u.id] && roleEdit[u.id] !== u.role && (
                                                        <button className={s.btnPrimary} style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleRoleUpdate(u.id)}>Save</button>
                                                    )}
                                                    <button className={s.btnGhost} style={{ padding: '4px 10px', fontSize: '0.75rem', color: u.isActive ? 'var(--danger)' : 'var(--resolved)' }} onClick={() => handleToggleStatus(u.id)}>
                                                        {u.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!users.length && <div className={s.empty}><div className={s.emptyIcon}>👥</div>No users found.</div>}
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}

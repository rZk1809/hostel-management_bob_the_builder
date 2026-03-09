import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowLeft, CheckCircle2, BarChart3, Inbox, Users,
    Wrench, Utensils, Wifi, Sparkles, Shield, MoreHorizontal, TrendingUp,
    UserCog, Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AppLayout from '../../layouts/AppLayout';
import Pagination from '../../components/Pagination';
import Comments from '../../components/Comments';
import ComplaintImages from '../../components/ComplaintImages';
import { STATUS_COLORS, PRIORITY_COLORS, fmtDate } from '../../utils';
import s from '../../styles/dashboard.module.css';

const CATEGORY_ICON_COMP = {
    maintenance: Wrench, food: Utensils, wifi: Wifi,
    cleanliness: Sparkles, security: Shield, other: MoreHorizontal,
};

const ROLES       = ['student', 'warden', 'admin', 'maintenance'];
const CATEGORIES  = ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'];
const PRIORITIES  = ['low', 'medium', 'high'];
const STATUS_TABS = [['', 'All'], ['open', 'Open'], ['in-progress', 'In Progress'], ['resolved', 'Resolved']];
const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const PAGE_TITLES = {
    'all-complaints': 'All Complaints',
    'analytics':      'Analytics',
    'users':          'User Management',
    'profile':        'My Profile',
};

const ROLE_STYLE = {
    admin:       { background: 'var(--danger-dim)',   color: 'var(--danger)' },
    warden:      { background: 'var(--accent-dim)',   color: 'var(--accent)' },
    maintenance: { background: 'var(--open-dim)',     color: 'var(--open)' },
    student:     { background: 'var(--resolved-dim)', color: 'var(--resolved)' },
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [page, setPage]               = useState('all-complaints');
    const [complaints, setComplaints]   = useState([]);
    const [users, setUsers]             = useState([]);
    const [analytics, setAnalytics]     = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [category, setCategory]       = useState('');
    const [priority, setPriority]       = useState('');
    const [searchVal, setSearchVal]     = useState('');
    const [search, setSearch]           = useState('');
    const [userSearchVal, setUserSearchVal] = useState('');
    const [userSearch, setUserSearch]   = useState('');
    const [roleFilter, setRoleFilter]   = useState('');
    const [selected, setSelected]       = useState(null);
    const [loading, setLoading]         = useState(true);
    const [pageNum, setPageNum]         = useState(1);
    const [pagination, setPagination]   = useState(null);
    const [roleEdit, setRoleEdit]       = useState({});

    // Debounce complaint search
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchVal), 400);
        return () => clearTimeout(t);
    }, [searchVal]);

    // Debounce user search
    useEffect(() => {
        const t = setTimeout(() => setUserSearch(userSearchVal), 400);
        return () => clearTimeout(t);
    }, [userSearchVal]);

    // Reset page on filter change
    useEffect(() => { setPageNum(1); }, [statusFilter, category, priority, search]);

    const loadComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {};
            if (statusFilter) filters.status   = statusFilter;
            if (category)     filters.category = category;
            if (priority)     filters.priority = priority;
            if (search)       filters.search   = search;

            const r = await api.getComplaints(filters, pageNum);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [statusFilter, category, priority, search, pageNum]);

    const loadAnalytics = useCallback(async () => {
        try { setAnalytics(await api.getAnalytics()); } catch (e) { console.error(e); }
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {};
            if (roleFilter)  filters.role   = roleFilter;
            if (userSearch)  filters.search = userSearch;
            const r = await api.getUsers(filters);
            setUsers(r.users ?? []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [roleFilter, userSearch]);

    useEffect(() => {
        if (page === 'all-complaints') { loadComplaints(); loadAnalytics(); }
    }, [page, loadComplaints, loadAnalytics]);
    useEffect(() => { if (page === 'analytics') loadAnalytics(); }, [page, loadAnalytics]);
    useEffect(() => { if (page === 'users') loadUsers(); }, [page, loadUsers]);

    const navigate = (p) => { setPage(p); setSelected(null); };

    const handleRoleUpdate = async (userId) => {
        try {
            await api.updateUserRole(userId, roleEdit[userId]);
            toast.success('Role updated.');
            setRoleEdit(r => { const n = { ...r }; delete n[userId]; return n; });
            loadUsers();
        } catch (e) { toast.error(e.message); }
    };

    const handleToggleStatus = async (userId) => {
        try {
            const res = await api.toggleUserStatus(userId);
            toast.success(res.message || 'Status updated.');
            loadUsers();
        } catch (e) { toast.error(e.message); }
    };

    const handleResolve = async (id) => {
        try { await api.updateComplaint(id, { status: 'resolved' }); toast.success('Marked as resolved.'); loadComplaints(); }
        catch (e) { toast.error(e.message); }
    };

    const statCards = analytics ? [
        { label: 'Total',       value: analytics.complaints.total,                          color: 'var(--text)' },
        { label: 'Open',        value: analytics.complaints.byStatus?.open ?? 0,            color: 'var(--open)' },
        { label: 'In Progress', value: analytics.complaints.byStatus?.['in-progress'] ?? 0, color: 'var(--progress)' },
        { label: 'Resolved',    value: analytics.complaints.byStatus?.resolved ?? 0,        color: 'var(--resolved)' },
    ] : [];

    return (
        <AppLayout activePage={page} onNavigate={navigate} title={PAGE_TITLES[page]}>

            {/* ── All Complaints ──────────────────────────────────── */}
            {page === 'all-complaints' && !selected && (
                <div className={s.page}>
                    {analytics && (
                        <div className={s.statsGrid}>
                            {statCards.map(c => (
                                <div key={c.label} className={s.statCard}>
                                    <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                    <span className={s.statLabel}>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        <div className={s.filterRow}>
                            <div className={s.statusTabs}>
                                {STATUS_TABS.map(([val, label]) => (
                                    <button
                                        key={val}
                                        className={`${s.statusTab} ${statusFilter === val ? s.statusTabActive : ''}`}
                                        onClick={() => setStatusFilter(val)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={s.filterRow}>
                            <div className={s.searchWrap}>
                                <Search size={13} />
                                <input
                                    className={s.searchInput}
                                    placeholder="Search complaints…"
                                    value={searchVal}
                                    onChange={e => setSearchVal(e.target.value)}
                                />
                            </div>
                            <select className={s.filterSelect} value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="">All Categories</option>
                                {CATEGORIES.map(v => <option key={v} value={v}>{cap(v)}</option>)}
                            </select>
                            <select className={s.filterSelect} value={priority} onChange={e => setPriority(e.target.value)}>
                                <option value="">All Priorities</option>
                                {PRIORITIES.map(v => <option key={v} value={v}>{cap(v)}</option>)}
                            </select>
                        </div>
                    </div>

                    {loading ? <SkeletonCards /> : complaints.length === 0 ? (
                        <div className={s.empty}>
                            <Inbox size={36} className={s.emptyIcon} strokeWidth={1.5} />
                            <span className={s.emptyTitle}>No complaints found</span>
                            <span style={{ fontSize: '0.825rem' }}>Try adjusting your filters.</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {complaints.map(c => {
                                const CatIcon = CATEGORY_ICON_COMP[c.category] || MoreHorizontal;
                                const statusColor   = STATUS_COLORS[c.status];
                                const priorityColor = PRIORITY_COLORS[c.priority];
                                return (
                                    <div key={c.id} className={s.complaintCard} style={{ borderLeftColor: statusColor }}>
                                        <div className={s.cardTopRow} onClick={() => setSelected(c)}>
                                            <div className={s.cardMeta}>
                                                <CatIcon size={13} className={s.cardMetaIcon} />
                                                <strong style={{ color: 'var(--text)' }}>Room {c.roomNumber}</strong>
                                                <span>·</span>
                                                <span>{c.studentName}</span>
                                            </div>
                                            <div className={s.cardBadges}>
                                                <span className={s.badge} style={{ background: `${priorityColor}18`, color: priorityColor }}>{c.priority}</span>
                                                <span className={s.badge} style={{ background: `${statusColor}18`, color: statusColor }}>{c.status}</span>
                                            </div>
                                        </div>
                                        <div className={s.cardTitle} onClick={() => setSelected(c)}>{c.title}</div>
                                        <div className={s.cardFooter}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                <span className={s.cardDate}>{fmtDate(c.createdAt)}</span>
                                                {c.assignedTo && (
                                                    <span className={s.assignedBadge}><UserCog size={10} /> {c.assignedTo.name}</span>
                                                )}
                                            </div>
                                            {c.status !== 'resolved' && (
                                                <button className={`${s.btnGhost} ${s.btnSm}`} style={{ color: 'var(--resolved)', borderColor: 'rgba(34,197,94,0.25)' }} onClick={() => handleResolve(c.id)}>
                                                    <CheckCircle2 size={11} /> Resolve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <Pagination pagination={pagination} onPageChange={setPageNum} />
                        </div>
                    )}
                </div>
            )}

            {/* ── Complaint detail ────────────────────────────────── */}
            {selected && page === 'all-complaints' && (
                <div>
                    <button className={s.btnGhost} style={{ marginBottom: '1rem' }} onClick={() => setSelected(null)}>
                        <ArrowLeft size={14} /> Back to complaints
                    </button>
                    <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r-xl)', padding: '1.75rem',
                        display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 720,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <span style={{ background: `${STATUS_COLORS[selected.status]}18`, color: STATUS_COLORS[selected.status], border: `1px solid ${STATUS_COLORS[selected.status]}30`, padding: '4px 12px', borderRadius: 99, fontSize: '0.775rem', fontWeight: 600 }}>
                                {selected.status}
                            </span>
                            {selected.status !== 'resolved' && (
                                <button className={s.btnGhost} style={{ color: 'var(--resolved)', borderColor: 'rgba(34,197,94,0.25)' }} onClick={() => { handleResolve(selected.id); setSelected(null); }}>
                                    <CheckCircle2 size={13} /> Mark Resolved
                                </button>
                            )}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{selected.title}</h2>
                            <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.8rem', color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span>{selected.category}</span>
                                <span>Room {selected.roomNumber}</span>
                                <span>{selected.studentName}</span>
                                {selected.assignedTo && (
                                    <span className={s.assignedBadge}><UserCog size={10} /> {selected.assignedTo.name}</span>
                                )}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem' }}>
                            {selected.description}
                        </p>
                        <ComplaintImages images={selected.images} />
                        <Comments complaintId={selected.id} />
                    </div>
                </div>
            )}

            {/* ── Analytics ─────────────────────────────────────────── */}
            {page === 'analytics' && (
                <div className={s.page}>
                    {!analytics ? <SkeletonCards /> : (
                        <>
                            <div className={s.statsGrid}>
                                {[
                                    ...statCards,
                                    { label: 'Total Users', value: analytics.users?.total ?? 0, color: 'var(--accent)' },
                                ].map(c => (
                                    <div key={c.label} className={s.statCard}>
                                        <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                        <span className={s.statLabel}>{c.label}</span>
                                    </div>
                                ))}
                            </div>

                            <AnalyticsPanel title="Users by Role" icon={<Users size={14} />}>
                                {Object.entries(analytics.users?.byRole || {}).map(([role, count]) => (
                                    <div key={role} className={s.barChartRow}>
                                        <span className={s.barLabel} style={{ textTransform: 'capitalize' }}>{role}</span>
                                        <div className={s.barTrack}>
                                            <div className={s.barFill} style={{ width: `${(count / Math.max(analytics.users.total, 1)) * 100}%` }} />
                                        </div>
                                        <span className={s.barCount}>{count}</span>
                                    </div>
                                ))}
                            </AnalyticsPanel>

                            <AnalyticsPanel title="Complaints by Category" icon={<BarChart3 size={14} />}>
                                {Object.entries(analytics.complaints.byCategory || {}).length === 0 ? (
                                    <div style={{ color: 'var(--muted)', fontSize: '0.825rem' }}>No data yet.</div>
                                ) : (() => {
                                    const max = Math.max(...Object.values(analytics.complaints.byCategory), 1);
                                    return Object.entries(analytics.complaints.byCategory).map(([cat, count]) => (
                                        <div key={cat} className={s.barChartRow}>
                                            <span className={s.barLabel}>{cat}</span>
                                            <div className={s.barTrack}><div className={s.barFill} style={{ width: `${(count / max) * 100}%` }} /></div>
                                            <span className={s.barCount}>{count}</span>
                                        </div>
                                    ));
                                })()}
                            </AnalyticsPanel>

                            {analytics.complaints.last7Days?.length > 0 && (
                                <AnalyticsPanel title="Last 7 Days" icon={<TrendingUp size={14} />}>
                                    {(() => {
                                        const max = Math.max(...analytics.complaints.last7Days.map(d => d.count), 1);
                                        return analytics.complaints.last7Days.map(d => (
                                            <div key={d._id} className={s.barChartRow}>
                                                <span className={s.barLabel}>{d._id}</span>
                                                <div className={s.barTrack}><div className={s.barFill} style={{ width: `${(d.count / max) * 100}%` }} /></div>
                                                <span className={s.barCount}>{d.count}</span>
                                            </div>
                                        ));
                                    })()}
                                </AnalyticsPanel>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── User Management ───────────────────────────────────── */}
            {page === 'users' && (
                <div className={s.page}>
                    <div className={s.filterRow}>
                        <div className={s.searchWrap}>
                            <Search size={13} />
                            <input
                                className={s.searchInput}
                                placeholder="Search users…"
                                value={userSearchVal}
                                onChange={e => setUserSearchVal(e.target.value)}
                            />
                        </div>
                        <select className={s.filterSelect} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                            <option value="">All Roles</option>
                            {ROLES.map(r => <option key={r} value={r}>{cap(r)}</option>)}
                        </select>
                    </div>

                    {loading ? <SkeletonCards /> : users.length === 0 ? (
                        <div className={s.empty}>
                            <Users size={36} className={s.emptyIcon} strokeWidth={1.5} />
                            <span className={s.emptyTitle}>No users found</span>
                        </div>
                    ) : (
                        <div className={s.tableWrap} style={{ overflowX: 'auto' }}>
                            <table className={s.table}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Room</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => {
                                        const rs = ROLE_STYLE[u.role] || ROLE_STYLE.student;
                                        const pendingRole = roleEdit[u.id];
                                        return (
                                            <tr key={u.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>{u.name}</div>
                                                    <div style={{ color: 'var(--muted)', fontSize: '0.72rem', fontFamily: 'DM Mono, monospace' }}>{u.email}</div>
                                                </td>
                                                <td>
                                                    <select
                                                        className={s.filterSelect}
                                                        value={pendingRole ?? u.role}
                                                        onChange={e => setRoleEdit(r => ({ ...r, [u.id]: e.target.value }))}
                                                        style={{ fontSize: '0.775rem' }}
                                                    >
                                                        {ROLES.map(r => <option key={r} value={r}>{cap(r)}</option>)}
                                                    </select>
                                                </td>
                                                <td>
                                                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.775rem', color: 'var(--text-2)' }}>
                                                        {u.roomNumber || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={s.badge} style={{
                                                        background: u.isActive ? 'var(--resolved-dim)' : 'var(--danger-dim)',
                                                        color: u.isActive ? 'var(--resolved)' : 'var(--danger)',
                                                    }}>
                                                        {u.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                        {pendingRole && pendingRole !== u.role && (
                                                            <button className={`${s.btnPrimary} ${s.btnSm}`} onClick={() => handleRoleUpdate(u.id)}>
                                                                <UserCog size={11} /> Save Role
                                                            </button>
                                                        )}
                                                        <button
                                                            className={`${s.btnGhost} ${s.btnSm}`}
                                                            style={{ color: u.isActive ? 'var(--danger)' : 'var(--resolved)', borderColor: u.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)' }}
                                                            onClick={() => handleToggleStatus(u.id)}
                                                        >
                                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Profile ───────────────────────────────────────────── */}
            {page === 'profile' && (
                <div className={s.page}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '2rem', maxWidth: 440 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700 }}>
                                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 4, background: 'var(--danger-dim)', color: 'var(--danger)', textTransform: 'capitalize' }}>
                                    {user?.role}
                                </div>
                            </div>
                        </div>
                        {[{ label: 'Email', value: user?.email }, { label: 'Role', value: user?.role }].map(f => (
                            <div key={f.label} style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
                                <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.875rem', textTransform: 'capitalize' }}>{f.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function AnalyticsPanel({ title, icon, children }) {
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', color: 'var(--text-2)' }}>
                {icon}
                <span style={{ fontSize: '0.775rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
            </div>
            {children}
        </div>
    );
}

function SkeletonCards() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3].map(i => (
                <div key={i} className={s.skeleton} style={{ height: 90, borderRadius: 'var(--r-lg)' }} />
            ))}
        </div>
    );
}

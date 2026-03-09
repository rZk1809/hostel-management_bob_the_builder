import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowLeft, CheckCircle2, Hammer, BarChart3, Inbox,
    Wrench, Utensils, Wifi, Sparkles, Shield, MoreHorizontal, TrendingUp,
    Search, UserCog,
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

const CATEGORIES  = ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'];
const PRIORITIES  = ['low', 'medium', 'high'];
const STATUS_TABS = [['', 'All'], ['open', 'Open'], ['in-progress', 'In Progress'], ['resolved', 'Resolved']];
const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const PAGE_TITLES = {
    'all-complaints': 'All Complaints',
    'analytics':      'Analytics',
    'profile':        'My Profile',
};

export default function WardenDashboard() {
    const { user } = useAuth();
    const [page, setPage]               = useState('all-complaints');
    const [complaints, setComplaints]   = useState([]);
    const [analytics, setAnalytics]     = useState(null);
    const [maintenanceStaff, setMaintStaff] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [category, setCategory]       = useState('');
    const [priority, setPriority]       = useState('');
    const [searchVal, setSearchVal]     = useState('');
    const [search, setSearch]           = useState('');
    const [selected, setSelected]       = useState(null);
    const [assigning, setAssigning]     = useState(null);
    const [assignTo, setAssignTo]       = useState('');
    const [loading, setLoading]         = useState(true);
    const [pageNum, setPageNum]         = useState(1);
    const [pagination, setPagination]   = useState(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchVal), 400);
        return () => clearTimeout(t);
    }, [searchVal]);

    // Reset page on filter change
    useEffect(() => { setPageNum(1); }, [statusFilter, category, priority, search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {};
            if (statusFilter) filters.status   = statusFilter;
            if (category)     filters.category = category;
            if (priority)     filters.priority = priority;
            if (search)       filters.search   = search;

            const [r, a, staff] = await Promise.all([
                api.getComplaints(filters, pageNum),
                api.getAnalytics(),
                api.getUsers({ role: 'maintenance' }),
            ]);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
            setAnalytics(a);
            setMaintStaff(staff.users ?? []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [statusFilter, category, priority, search, pageNum]);

    useEffect(() => { load(); }, [load]);

    const navigate = (p) => { setPage(p); setSelected(null); };

    const handleAssign = async () => {
        try {
            await api.assignComplaint(assigning.id, { assignedTo: assignTo || null });
            toast.success('Complaint assigned successfully.');
            setAssigning(null); setAssignTo('');
            load();
        } catch (e) { toast.error(e.message); }
    };

    const quickResolve = async (id) => {
        try {
            await api.updateComplaint(id, { status: 'resolved' });
            toast.success('Marked as resolved.');
            load();
        } catch (e) { toast.error(e.message); }
    };

    const statCards = analytics ? [
        { label: 'Total',       value: analytics.complaints.total,                          color: 'var(--text)' },
        { label: 'Open',        value: analytics.complaints.byStatus?.open ?? 0,            color: 'var(--open)' },
        { label: 'In Progress', value: analytics.complaints.byStatus?.['in-progress'] ?? 0, color: 'var(--progress)' },
        { label: 'Resolved',    value: analytics.complaints.byStatus?.resolved ?? 0,        color: 'var(--resolved)' },
    ] : [];

    return (
        <AppLayout activePage={page} onNavigate={navigate} title={PAGE_TITLES[page]}>

            {/* ── Assign modal ──────────────────────────────────────── */}
            {assigning && (
                <div className={s.modalOverlay}>
                    <div className={s.modal}>
                        <div className={s.modalTitle}>Assign Complaint</div>
                        <div style={{ fontSize: '0.8375rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                            <strong style={{ color: 'var(--text)' }}>{assigning.title}</strong>
                            <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                                Room {assigning.roomNumber} · {assigning.studentName}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Assign to
                            </label>
                            <select className={s.input} value={assignTo} onChange={e => setAssignTo(e.target.value)}>
                                <option value="">— Unassigned —</option>
                                {maintenanceStaff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            {maintenanceStaff.length === 0 && (
                                <div style={{ fontSize: '0.775rem', color: 'var(--muted)' }}>No maintenance staff found.</div>
                            )}
                        </div>
                        <div className={s.modalActions}>
                            <button className={s.btnGhost} onClick={() => { setAssigning(null); setAssignTo(''); }}>Cancel</button>
                            <button className={s.btnPrimary} onClick={handleAssign}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Complaints list ───────────────────────────────────── */}
            {page === 'all-complaints' && !selected && (
                <div className={s.page}>
                    {/* Stats */}
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

                    {/* Filters */}
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

                    {/* List */}
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                                                <span className={s.cardDate}>{fmtDate(c.createdAt)}</span>
                                                {c.assignedTo
                                                    ? <span className={s.assignedBadge}><UserCog size={10} /> {c.assignedTo.name}</span>
                                                    : <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Unassigned</span>
                                                }
                                            </div>
                                            <div className={s.cardActions}>
                                                <button className={`${s.btnGhost} ${s.btnSm}`} onClick={() => { setAssigning(c); setAssignTo(c.assignedTo?.id || ''); }}>
                                                    <Hammer size={11} /> Assign
                                                </button>
                                                {c.status !== 'resolved' && (
                                                    <button className={`${s.btnGhost} ${s.btnSm}`} style={{ color: 'var(--resolved)', borderColor: 'rgba(34,197,94,0.25)' }} onClick={() => quickResolve(c.id)}>
                                                        <CheckCircle2 size={11} /> Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <Pagination pagination={pagination} onPageChange={setPageNum} />
                        </div>
                    )}
                </div>
            )}

            {/* ── Complaint detail ──────────────────────────────────── */}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <span style={{
                                background: `${STATUS_COLORS[selected.status]}18`,
                                color: STATUS_COLORS[selected.status],
                                border: `1px solid ${STATUS_COLORS[selected.status]}30`,
                                padding: '4px 12px', borderRadius: 99, fontSize: '0.775rem', fontWeight: 600,
                            }}>
                                {selected.status}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button className={s.btnPrimary} onClick={() => { setAssigning(selected); setAssignTo(selected.assignedTo?.id || ''); }}>
                                    <Hammer size={13} /> Assign Staff
                                </button>
                                {selected.status !== 'resolved' && (
                                    <button className={s.btnGhost} style={{ color: 'var(--resolved)', borderColor: 'rgba(34,197,94,0.25)' }} onClick={() => { quickResolve(selected.id); setSelected(null); }}>
                                        <CheckCircle2 size={13} /> Mark Resolved
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                                {selected.title}
                            </h2>
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
                                {statCards.map(c => (
                                    <div key={c.label} className={s.statCard}>
                                        <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                        <span className={s.statLabel}>{c.label}</span>
                                    </div>
                                ))}
                            </div>

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

                            <AnalyticsPanel title="By Priority" icon={<BarChart3 size={14} />}>
                                {Object.entries(analytics.complaints.byPriority || {}).length === 0 ? (
                                    <div style={{ color: 'var(--muted)', fontSize: '0.825rem' }}>No data yet.</div>
                                ) : (() => {
                                    const max = Math.max(...Object.values(analytics.complaints.byPriority), 1);
                                    return Object.entries(analytics.complaints.byPriority).map(([pr, count]) => (
                                        <div key={pr} className={s.barChartRow}>
                                            <span className={s.barLabel}>{pr}</span>
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

            {/* ── Profile ───────────────────────────────────────────── */}
            {page === 'profile' && (
                <div className={s.page}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '2rem', maxWidth: 440 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700 }}>
                                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 4, background: 'var(--accent-dim)', color: 'var(--accent)', textTransform: 'capitalize' }}>
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

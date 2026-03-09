import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowLeft, CheckCircle2, Play, Inbox,
    Wrench, Utensils, Wifi, Sparkles, Shield, MoreHorizontal, UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AppLayout from '../../layouts/AppLayout';
import Pagination from '../../components/Pagination';
import Comments from '../../components/Comments';
import ComplaintImages from '../../components/ComplaintImages';
import { STATUS_COLORS, fmtDate } from '../../utils';
import s from '../../styles/dashboard.module.css';

const CATEGORY_ICON_COMP = {
    maintenance: Wrench, food: Utensils, wifi: Wifi,
    cleanliness: Sparkles, security: Shield, other: MoreHorizontal,
};

const STATUS_TABS = [['', 'All'], ['open', 'Open'], ['in-progress', 'In Progress'], ['resolved', 'Resolved']];

const PAGE_TITLES = {
    'assigned': 'Assigned Tasks',
    'profile':  'My Profile',
};

export default function MaintenanceDashboard() {
    const { user } = useAuth();
    const [page, setPage]               = useState('assigned');
    const [complaints, setComplaints]   = useState([]);
    const [selected, setSelected]       = useState(null);
    const [loading, setLoading]         = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [pageNum, setPageNum]         = useState(1);
    const [pagination, setPagination]   = useState(null);

    useEffect(() => { setPageNum(1); }, [statusFilter]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {};
            if (statusFilter) filters.status = statusFilter;
            const r = await api.getComplaints(filters, pageNum);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [statusFilter, pageNum]);

    useEffect(() => { if (page === 'assigned') load(); }, [load, page]);

    const navigate = (p) => { setPage(p); setSelected(null); };

    const markInProgress = async (id) => {
        try {
            await api.updateComplaint(id, { status: 'in-progress' });
            toast.success('Marked as in progress.');
            load();
        } catch (e) { toast.error(e.message); }
    };

    const markResolved = async (id) => {
        try {
            await api.updateComplaint(id, { status: 'resolved' });
            toast.success('Task marked as resolved.');
            setSelected(null);
            load();
        } catch (e) { toast.error(e.message); }
    };

    /* Quick stats from loaded data (filtered set) */
    const all  = complaints.length;
    const open = complaints.filter(c => c.status === 'open').length;
    const inP  = complaints.filter(c => c.status === 'in-progress').length;
    const done = complaints.filter(c => c.status === 'resolved').length;

    const statCards = [
        { label: 'Total Assigned', value: all,  color: 'var(--text)' },
        { label: 'Open',           value: open, color: 'var(--open)' },
        { label: 'In Progress',    value: inP,  color: 'var(--progress)' },
        { label: 'Resolved',       value: done, color: 'var(--resolved)' },
    ];

    return (
        <AppLayout activePage={page} onNavigate={navigate} title={PAGE_TITLES[page]}>

            {/* ── Assigned task list ───────────────────────────────── */}
            {page === 'assigned' && !selected && (
                <div className={s.page}>
                    {!loading && (
                        <div className={s.statsGrid}>
                            {statCards.map(c => (
                                <div key={c.label} className={s.statCard}>
                                    <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                    <span className={s.statLabel}>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Status tabs */}
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

                    {loading ? <SkeletonCards /> : complaints.length === 0 ? (
                        <div className={s.empty}>
                            <CheckCircle2 size={36} className={s.emptyIcon} strokeWidth={1.5} color="var(--resolved)" />
                            <span className={s.emptyTitle}>All clear!</span>
                            <span style={{ fontSize: '0.825rem' }}>
                                {statusFilter ? 'No tasks with this status.' : 'No tasks currently assigned to you.'}
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {complaints.map(c => {
                                const CatIcon    = CATEGORY_ICON_COMP[c.category] || MoreHorizontal;
                                const statusColor = STATUS_COLORS[c.status];
                                return (
                                    <div key={c.id} className={s.complaintCard} style={{ borderLeftColor: statusColor }}>
                                        <div className={s.cardTopRow} onClick={() => setSelected(c)}>
                                            <div className={s.cardMeta}>
                                                <CatIcon size={13} className={s.cardMetaIcon} />
                                                <strong style={{ color: 'var(--text)' }}>Room {c.roomNumber}</strong>
                                                <span>·</span>
                                                <span>{c.category}</span>
                                            </div>
                                            <span className={s.badge} style={{ background: `${statusColor}18`, color: statusColor }}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <div className={s.cardTitle} onClick={() => setSelected(c)}>{c.title}</div>
                                        <div className={s.cardFooter}>
                                            <span className={s.cardDate}>Assigned: {fmtDate(c.updatedAt)}</span>
                                            <div className={s.cardActions}>
                                                {c.status === 'open' && (
                                                    <button className={`${s.btnGhost} ${s.btnSm}`} style={{ color: 'var(--progress)', borderColor: 'rgba(245,158,11,0.25)' }} onClick={() => markInProgress(c.id)}>
                                                        <Play size={10} /> Start
                                                    </button>
                                                )}
                                                {c.status !== 'resolved' && (
                                                    <button className={`${s.btnGhost} ${s.btnSm}`} style={{ color: 'var(--resolved)', borderColor: 'rgba(34,197,94,0.25)' }} onClick={() => markResolved(c.id)}>
                                                        <CheckCircle2 size={10} /> Done
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

            {/* ── Task detail ──────────────────────────────────────── */}
            {selected && page === 'assigned' && (
                <div>
                    <button className={s.btnGhost} style={{ marginBottom: '1rem' }} onClick={() => setSelected(null)}>
                        <ArrowLeft size={14} /> Back to tasks
                    </button>
                    <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r-xl)', padding: '1.75rem',
                        display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 720,
                    }}>
                        {/* Status + Room */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{
                                background: `${STATUS_COLORS[selected.status]}18`,
                                color: STATUS_COLORS[selected.status],
                                border: `1px solid ${STATUS_COLORS[selected.status]}30`,
                                padding: '4px 12px', borderRadius: 99, fontSize: '0.775rem', fontWeight: 600,
                            }}>
                                {selected.status}
                            </span>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--muted)' }}>
                                Room {selected.roomNumber}
                            </span>
                        </div>

                        {/* Title + meta */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                                {selected.title}
                            </h2>
                            <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.8rem', color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span>{selected.category}</span>
                                <span>Reported {fmtDate(selected.createdAt)}</span>
                                {selected.assignedTo && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--open)' }}>
                                        <UserCog size={12} /> {selected.assignedTo.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem' }}>
                            {selected.description}
                        </p>

                        <ComplaintImages images={selected.images} />

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                            {selected.status === 'open' && (
                                <button className={s.btnGhost} style={{ color: 'var(--progress)', borderColor: 'rgba(245,158,11,0.25)' }}
                                    onClick={() => { markInProgress(selected.id); setSelected(p => ({ ...p, status: 'in-progress' })); }}>
                                    <Play size={13} /> Mark In Progress
                                </button>
                            )}
                            {selected.status !== 'resolved' && (
                                <button className={s.btnPrimary} onClick={() => markResolved(selected.id)}>
                                    <CheckCircle2 size={13} /> Mark as Resolved
                                </button>
                            )}
                        </div>

                        <Comments complaintId={selected.id} />
                    </div>
                </div>
            )}

            {/* ── Profile ───────────────────────────────────────────── */}
            {page === 'profile' && (
                <div className={s.page}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '2rem', maxWidth: 440 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--open)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700 }}>
                                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 4, background: 'var(--open-dim)', color: 'var(--open)', textTransform: 'capitalize' }}>
                                    {user?.role}
                                </div>
                            </div>
                        </div>
                        {[
                            { label: 'Full Name', value: user?.name },
                            { label: 'Email',     value: user?.email },
                            { label: 'Role',      value: user?.role },
                        ].map(f => (
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

function SkeletonCards() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3].map(i => (
                <div key={i} className={s.skeleton} style={{ height: 90, borderRadius: 'var(--r-lg)' }} />
            ))}
        </div>
    );
}

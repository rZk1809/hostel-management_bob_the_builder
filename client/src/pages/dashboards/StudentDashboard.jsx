import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    PlusCircle, Circle, Clock, CheckCircle2,
    Inbox, ArrowLeft, Wrench, Utensils, Wifi, Sparkles, Shield, MoreHorizontal, Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AppLayout from '../../layouts/AppLayout';
import ComplaintForm from '../../components/ComplaintForm';
import ComplaintDetail from '../../components/ComplaintDetail';
import Pagination from '../../components/Pagination';
import { STATUS_COLORS, PRIORITY_COLORS, fmtDate } from '../../utils';
import s from '../../styles/dashboard.module.css';

const CATEGORY_ICON_COMP = {
    maintenance: Wrench, food: Utensils, wifi: Wifi,
    cleanliness: Sparkles, security: Shield, other: MoreHorizontal,
};

const STATUS_ICON = { open: Circle, 'in-progress': Clock, resolved: CheckCircle2 };

const PAGE_TITLES = {
    'my-complaints': 'My Complaints',
    'new-complaint': 'New Complaint',
    'profile':       'My Profile',
};

const CATEGORIES = ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'];
const STATUS_TABS = [['', 'All'], ['open', 'Open'], ['in-progress', 'In Progress'], ['resolved', 'Resolved']];

export default function StudentDashboard() {
    const { user } = useAuth();
    const [page, setPage]             = useState('my-complaints');
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats]           = useState(null);
    const [selected, setSelected]     = useState(null);
    const [loading, setLoading]       = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [category, setCategory]     = useState('');
    const [searchVal, setSearchVal]   = useState('');
    const [search, setSearch]         = useState('');
    const [pageNum, setPageNum]       = useState(1);
    const [pagination, setPagination] = useState(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchVal), 400);
        return () => clearTimeout(t);
    }, [searchVal]);

    // Reset page on filter change
    useEffect(() => { setPageNum(1); }, [statusFilter, category, search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {};
            if (statusFilter) filters.status   = statusFilter;
            if (category)     filters.category = category;
            if (search)       filters.search   = search;

            const [r, st] = await Promise.all([
                api.getComplaints(filters, pageNum),
                api.getStats(),
            ]);
            setComplaints(r.complaints ?? r);
            setPagination(r.pagination || null);
            setStats(st);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [statusFilter, category, search, pageNum]);

    useEffect(() => { if (page === 'my-complaints') load(); }, [load, page]);

    const navigate = (p) => { setPage(p); setSelected(null); };

    const statCards = [
        { label: 'Total',       value: stats?.total ?? 0,                     color: 'var(--text)' },
        { label: 'Open',        value: stats?.byStatus?.open ?? 0,            color: 'var(--open)' },
        { label: 'In Progress', value: stats?.byStatus?.['in-progress'] ?? 0, color: 'var(--progress)' },
        { label: 'Resolved',    value: stats?.byStatus?.resolved ?? 0,        color: 'var(--resolved)' },
    ];

    return (
        <AppLayout activePage={page} onNavigate={navigate} title={PAGE_TITLES[page] || 'HostelDesk'}>

            {/* ── My Complaints ──────────────────────────────────────── */}
            {page === 'my-complaints' && !selected && (
                <div className={s.page}>
                    {/* Stats */}
                    {stats && (
                        <div className={s.statsGrid}>
                            {statCards.map(c => (
                                <div key={c.label} className={s.statCard}>
                                    <span className={s.statValue} style={{ color: c.color }}>{c.value}</span>
                                    <span className={s.statLabel}>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Status tabs + filters + CTA */}
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
                            <button
                                className={s.btnPrimary}
                                style={{ marginLeft: 'auto' }}
                                onClick={() => navigate('new-complaint')}
                            >
                                <PlusCircle size={13} /> New Complaint
                            </button>
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
                            <select
                                className={s.filterSelect}
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* List */}
                    {loading ? (
                        <SkeletonCards />
                    ) : complaints.length === 0 ? (
                        <div className={s.empty}>
                            <Inbox size={36} className={s.emptyIcon} strokeWidth={1.5} />
                            <span className={s.emptyTitle}>No complaints found</span>
                            <span style={{ fontSize: '0.825rem' }}>
                                {statusFilter || category || search
                                    ? 'Try clearing your filters.'
                                    : 'File your first complaint and we\'ll get it resolved.'}
                            </span>
                            {!statusFilter && !category && !search && (
                                <button
                                    className={s.btnPrimary}
                                    style={{ marginTop: '0.5rem' }}
                                    onClick={() => navigate('new-complaint')}
                                >
                                    <PlusCircle size={13} /> File a complaint
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {complaints.map(c => <ComplaintCard key={c.id} c={c} onClick={() => setSelected(c)} />)}
                            <Pagination pagination={pagination} onPageChange={setPageNum} />
                        </div>
                    )}
                </div>
            )}

            {/* ── Detail ─────────────────────────────────────────────── */}
            {page === 'my-complaints' && selected && (
                <div>
                    <button className={s.btnGhost} style={{ marginBottom: '1rem' }} onClick={() => setSelected(null)}>
                        <ArrowLeft size={14} /> Back to complaints
                    </button>
                    <ComplaintDetail
                        complaint={selected}
                        onUpdate={load}
                        onDelete={() => { setSelected(null); load(); }}
                    />
                </div>
            )}

            {/* ── New Complaint ─────────────────────────────────────── */}
            {page === 'new-complaint' && (
                <div>
                    <button className={s.btnGhost} style={{ marginBottom: '1rem' }} onClick={() => navigate('my-complaints')}>
                        <ArrowLeft size={14} /> Back
                    </button>
                    <ComplaintForm
                        onSuccess={() => { toast.success('Complaint submitted!'); navigate('my-complaints'); load(); }}
                        onCancel={() => navigate('my-complaints')}
                    />
                </div>
            )}

            {/* ── Profile ──────────────────────────────────────────── */}
            {page === 'profile' && <ProfileCard user={user} />}
        </AppLayout>
    );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function ComplaintCard({ c, onClick }) {
    const CatIcon    = CATEGORY_ICON_COMP[c.category] || MoreHorizontal;
    const statusColor   = STATUS_COLORS[c.status];
    const priorityColor = PRIORITY_COLORS[c.priority];

    return (
        <div className={s.complaintCard} style={{ borderLeftColor: statusColor }} onClick={onClick}>
            <div className={s.cardTopRow}>
                <div className={s.cardMeta}>
                    <CatIcon size={13} className={s.cardMetaIcon} />
                    <span>{c.category}</span>
                </div>
                <div className={s.cardBadges}>
                    <span className={s.badge} style={{ background: `${priorityColor}18`, color: priorityColor }}>
                        {c.priority}
                    </span>
                    <span className={s.badge} style={{ background: `${statusColor}18`, color: statusColor }}>
                        {c.status}
                    </span>
                </div>
            </div>
            <div className={s.cardTitle}>{c.title}</div>
            <div className={s.cardDesc}>{c.description}</div>
            <div className={s.cardFooter}>
                <span className={s.cardDate}>{fmtDate(c.createdAt)}</span>
            </div>
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

function ProfileCard({ user }) {
    const fields = [
        { label: 'Full Name',   value: user?.name },
        { label: 'Email',       value: user?.email },
        { label: 'Role',        value: user?.role },
        { label: 'Room Number', value: user?.roomNumber || 'Not assigned' },
    ];

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div className={s.page}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '2rem', maxWidth: 440 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, flexShrink: 0 }}>
                        {initials}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 4, background: 'var(--resolved-dim)', color: 'var(--resolved)', textTransform: 'capitalize' }}>
                            {user?.role}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                    {fields.map(f => (
                        <div key={f.label}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.25rem' }}>
                                {f.label}
                            </div>
                            <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.875rem', fontFamily: f.label === 'Room Number' ? 'DM Mono, monospace' : 'inherit' }}>
                                {f.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

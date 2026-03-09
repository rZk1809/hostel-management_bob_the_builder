import { useState } from 'react';
import { Trash2, User, Clock, Wrench, Utensils, Wifi, Sparkles, Shield, MoreHorizontal, CheckCircle2, UserCog } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { STATUS_COLORS, PRIORITY_COLORS, fmtDate } from '../utils';
import ComplaintImages from './ComplaintImages';
import Comments from './Comments';
import styles from './ComplaintDetail.module.css';

const STATUSES   = ['open', 'in-progress', 'resolved'];
const PRIORITIES = ['low', 'medium', 'high'];
const STEP_LABELS = ['Open', 'In Progress', 'Resolved'];

const CATEGORY_ICONS_COMP = {
    maintenance: Wrench, food: Utensils, wifi: Wifi,
    cleanliness: Sparkles, security: Shield, other: MoreHorizontal,
};

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export default function ComplaintDetail({ complaint: init, onUpdate, onDelete }) {
    const { user } = useAuth();
    const [c, setC] = useState(init);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isStaff = ['admin', 'warden', 'maintenance'].includes(user?.role);
    const canDelete = user?.role === 'admin' || user?.role === 'warden' || c.user === user?.id;

    const patch = async (data) => {
        setSaving(true);
        try {
            const updated = await api.updateComplaint(c.id, data);
            setC(updated);
            onUpdate?.();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this complaint? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await api.deleteComplaint(c.id);
            onDelete?.();
        } catch (e) {
            console.error(e);
            setDeleting(false);
        }
    };

    const CatIcon = CATEGORY_ICONS_COMP[c.category] || MoreHorizontal;
    const statusColor = STATUS_COLORS[c.status];
    const currentStep = STATUSES.indexOf(c.status);

    return (
        <div className={styles.wrap}>
            {/* Top row */}
            <div className={styles.topRow}>
                <div className={styles.topLeft}>
                    <span className={styles.roomBadge}>Room {c.roomNumber}</span>
                    <span
                        className={styles.statusBadge}
                        style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}
                    >
                        {c.status}
                    </span>
                </div>
                {canDelete && (
                    <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
                        <Trash2 size={12} />
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                )}
            </div>

            {/* Progress stepper */}
            <div className={styles.stepper}>
                {STATUSES.map((key, i) => {
                    const done   = i < currentStep;
                    const active = i === currentStep;
                    return [
                        <div key={key} className={styles.stepItem}>
                            <div className={`${styles.stepDot} ${active ? styles.stepDotActive : ''} ${done ? styles.stepDotDone : ''}`}>
                                {done ? <CheckCircle2 size={12} /> : i + 1}
                            </div>
                            <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>
                                {STEP_LABELS[i]}
                            </span>
                        </div>,
                        i < STATUSES.length - 1
                            ? <div key={`line-${i}`} className={`${styles.stepConnector} ${done ? styles.stepConnectorDone : ''}`} />
                            : null,
                    ];
                })}
            </div>

            {/* Title */}
            <h2 className={styles.title}>{c.title}</h2>

            {/* Meta */}
            <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                    <CatIcon size={13} />
                    {cap(c.category)}
                </span>
                <span className={styles.metaItem}>
                    <User size={13} />
                    {c.studentName}
                </span>
                <span className={styles.metaItem}>
                    <Clock size={13} />
                    {fmtDate(c.createdAt)}
                </span>
            </div>

            {/* Assigned staff */}
            {c.assignedTo && (
                <div className={styles.assignedRow}>
                    <UserCog size={13} />
                    <span>Assigned to</span>
                    <span className={styles.assignedBadge}>{c.assignedTo.name}</span>
                </div>
            )}

            {/* Description */}
            <p className={styles.description}>{c.description}</p>

            {/* Images */}
            <ComplaintImages images={c.images} />

            {/* Status / Priority controls (staff only) */}
            {isStaff && (
                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <span className={styles.controlLabel}>Status</span>
                        <div className={styles.chips}>
                            {STATUSES.map(st => (
                                <button
                                    key={st}
                                    className={styles.chip}
                                    style={{
                                        background: c.status === st ? `${STATUS_COLORS[st]}18` : 'transparent',
                                        border: `1px solid ${c.status === st ? STATUS_COLORS[st] : 'var(--border)'}`,
                                        color: c.status === st ? STATUS_COLORS[st] : 'var(--muted)',
                                    }}
                                    onClick={() => !saving && patch({ status: st })}
                                    disabled={saving}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.controlGroup}>
                        <span className={styles.controlLabel}>Priority</span>
                        <div className={styles.chips}>
                            {PRIORITIES.map(pr => (
                                <button
                                    key={pr}
                                    className={styles.chip}
                                    style={{
                                        background: c.priority === pr ? `${PRIORITY_COLORS[pr]}18` : 'transparent',
                                        border: `1px solid ${c.priority === pr ? PRIORITY_COLORS[pr] : 'var(--border)'}`,
                                        color: c.priority === pr ? PRIORITY_COLORS[pr] : 'var(--muted)',
                                    }}
                                    onClick={() => !saving && patch({ priority: pr })}
                                    disabled={saving}
                                >
                                    {pr}
                                </button>
                            ))}
                        </div>
                    </div>

                    {saving && <div className={styles.saving}>Saving changes…</div>}
                </div>
            )}

            {/* Timestamps */}
            <div className={styles.timestamps}>
                <span>Created: {fmtDate(c.createdAt)}</span>
                <span>Updated: {fmtDate(c.updatedAt)}</span>
            </div>

            {/* Comments */}
            <Comments complaintId={c.id} />
        </div>
    );
}

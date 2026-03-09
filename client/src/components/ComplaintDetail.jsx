import { useState } from 'react';
import { api } from '../api';
import { STATUS_COLORS, PRIORITY_COLORS, CATEGORY_ICONS, fmtDate } from '../utils';
import ComplaintImages from './ComplaintImages';
import Comments from './Comments';
import styles from './ComplaintDetail.module.css';

const STATUSES = ['open', 'in-progress', 'resolved'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function ComplaintDetail({ complaint: init, onUpdate, onDelete }) {
  const [c, setC] = useState(init);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patch = async (data) => {
    setSaving(true);
    const updated = await api.updateComplaint(c.id, data);
    setC(updated);
    onUpdate();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this complaint?')) return;
    setDeleting(true);
    await api.deleteComplaint(c.id);
    onDelete();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.roomBadge}>Room {c.roomNumber}</div>
        <div className={styles.actions}>
          <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : '🗑 Delete'}
          </button>
        </div>
      </div>

      <h2 className={styles.title}>{c.title}</h2>

      <div className={styles.metaRow}>
        <span>{CATEGORY_ICONS[c.category] || '📋'} {capitalize(c.category)}</span>
        <span>👤 {c.studentName}</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--muted)' }}>{fmtDate(c.createdAt)}</span>
      </div>

      <p className={styles.description}>{c.description}</p>

      <ComplaintImages images={c.images} />

      <div className={styles.controls}>
        <Control label="Status">
          <div className={styles.chips}>
            {STATUSES.map(s => (
              <Chip
                key={s}
                active={c.status === s}
                color={STATUS_COLORS[s]}
                onClick={() => !saving && patch({ status: s })}
              >{s}</Chip>
            ))}
          </div>
        </Control>

        <Control label="Priority">
          <div className={styles.chips}>
            {PRIORITIES.map(p => (
              <Chip
                key={p}
                active={c.priority === p}
                color={PRIORITY_COLORS[p]}
                onClick={() => !saving && patch({ priority: p })}
              >{p}</Chip>
            ))}
          </div>
        </Control>
      </div>

      {saving && <div className={styles.saving}>Saving…</div>}

      <div className={styles.timestamps}>
        <span>Created: {fmtDate(c.createdAt)}</span>
        <span>Updated: {fmtDate(c.updatedAt)}</span>
      </div>

      <Comments complaintId={c.id} />
    </div>
  );
}

function Control({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}22` : 'transparent',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        color: active ? color : 'var(--muted)',
        padding: '5px 14px',
        borderRadius: '99px',
        fontSize: '0.78rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        cursor: 'pointer',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  );
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import styles from './ComplaintForm.module.css';

const CATEGORIES = ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ComplaintForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    category: 'maintenance',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title || form.title.trim().length < 3) {
      setError('Please enter a title (at least 3 characters).');
      return;
    }
    if (!form.description || form.description.trim().length < 10) {
      setError('Please describe the issue (at least 10 characters).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let imageUrl = null;
      if (image) {
        const res = await api.uploadImage(image);
        imageUrl = res.url;
      }

      const payload = { ...form };
      if (imageUrl) payload.images = [imageUrl];

      await api.createComplaint(payload);
      onSuccess();
    } catch (e) {
      setError(e.message || 'Failed to submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>New Complaint</h2>

      {/* Show who is filing — read-only from auth context */}
      <div className={styles.filedBy}>
        Filing as <strong>{user?.name}</strong>
        {user?.roomNumber ? ` · Room ${user.roomNumber}` : ''}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.row}>
        <Field label="Category">
          <select className={styles.input} value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className={styles.input} value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => <option key={p} value={p}>{capitalize(p)}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Title *">
        <input
          className={styles.input}
          value={form.title}
          onChange={set('title')}
          placeholder="Brief title of the issue"
          maxLength={200}
        />
      </Field>

      <Field label="Description *">
        <textarea
          className={styles.input}
          rows={4}
          value={form.description}
          onChange={set('description')}
          placeholder="Describe the issue in detail (min 10 characters)…"
          maxLength={2000}
        />
      </Field>

      <Field label="Attachment (Optional)">
        <input
          type="file"
          accept="image/*"
          className={styles.input}
          style={{ padding: '0.4rem', fontSize: '0.85rem' }}
          onChange={(e) => setImage(e.target.files[0] || null)}
        />
        {image && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>Selected: {image.name}</div>}
      </Field>

      <div className={styles.actions}>
        <button className={styles.cancel} onClick={onCancel}>Cancel</button>
        <button className={styles.submit} onClick={submit} disabled={saving}>
          {saving ? 'Submitting…' : 'Submit Complaint'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

import { useState } from 'react';
import { AlertCircle, User, Paperclip } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import styles from './ComplaintForm.module.css';

const CATEGORIES = ['maintenance', 'food', 'wifi', 'cleanliness', 'security', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ComplaintForm({ onSuccess, onCancel }) {
    const { user } = useAuth();
    const [form, setForm] = useState({ category: 'maintenance', title: '', description: '', priority: 'medium' });
    const [image, setImage] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title || form.title.trim().length < 3) {
            setError('Title must be at least 3 characters.');
            return;
        }
        if (!form.description || form.description.trim().length < 10) {
            setError('Description must be at least 10 characters.');
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
        <form className={styles.wrap} onSubmit={submit}>
            <div>
                <h2 className={styles.heading}>File a Complaint</h2>
            </div>

            {/* Who is filing */}
            <div className={styles.filedBy}>
                <User size={13} />
                <span>Filing as</span>
                <span className={styles.filedByName}>{user?.name}</span>
                {user?.roomNumber && (
                    <span className={styles.filedByRoom}>Room {user.roomNumber}</span>
                )}
            </div>

            {error && (
                <div className={styles.error}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                </div>
            )}

            <div className={styles.row}>
                <Field label="Category" styles={styles}>
                    <select className={styles.input} value={form.category} onChange={set('category')}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{cap(c)}</option>)}
                    </select>
                </Field>
                <Field label="Priority" styles={styles}>
                    <select className={styles.input} value={form.priority} onChange={set('priority')}>
                        {PRIORITIES.map(p => <option key={p} value={p}>{cap(p)}</option>)}
                    </select>
                </Field>
            </div>

            <Field label="Title *" styles={styles}>
                <input
                    className={styles.input}
                    value={form.title}
                    onChange={set('title')}
                    placeholder="Brief description of the issue"
                    maxLength={200}
                />
            </Field>

            <Field label="Description *" styles={styles}>
                <textarea
                    className={styles.input}
                    rows={4}
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Describe the issue in detail (minimum 10 characters)…"
                    maxLength={2000}
                />
            </Field>

            <Field label="Attachment (optional)" styles={styles}>
                <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={e => setImage(e.target.files[0] || null)}
                />
                {image ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--resolved)', marginTop: 4 }}>
                        <Paperclip size={11} />
                        {image.name}
                    </div>
                ) : (
                    <div className={styles.fileHint}>Supports JPG, PNG, WEBP</div>
                )}
            </Field>

            <div className={styles.actions}>
                <button type="button" className={styles.cancel} onClick={onCancel}>Cancel</button>
                <button type="submit" className={styles.submit} disabled={saving}>
                    {saving ? 'Submitting…' : 'Submit Complaint'}
                </button>
            </div>
        </form>
    );
}

function Field({ label, children, styles }) {
    return (
        <div className={styles.fieldGroup}>
            <label className={styles.label}>{label}</label>
            {children}
        </div>
    );
}

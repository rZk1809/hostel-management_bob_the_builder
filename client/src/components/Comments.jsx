import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { fmtDate } from '../utils';
import s from '../styles/dashboard.module.css';

export default function Comments({ complaintId }) {
    const [comments, setComments] = useState([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    const load = useCallback(async () => {
        try {
            setComments(await api.getComments(complaintId));
        } catch (e) {
            console.error('Failed to load comments', e);
        } finally {
            setLoading(false);
        }
    }, [complaintId]);

    useEffect(() => { load(); }, [load]);

    const postComment = async () => {
        if (!msg.trim()) return;
        setPosting(true);
        try {
            await api.addComment(complaintId, msg);
            setMsg('');
            load();
        } catch (e) {
            toast.error(e.message || 'Failed to post comment');
        } finally {
            setPosting(false);
        }
    };

    if (loading) return <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>Loading comments…</div>;

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Comments ({comments.length})</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {comments.map(c => (
                    <div key={c.id} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {c.user?.name} <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '4px', textTransform: 'capitalize' }}>({c.user?.role})</span>
                            </span>
                            <span style={{ color: 'var(--muted)' }}>{fmtDate(c.createdAt)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>{c.message}</p>
                    </div>
                ))}
                {comments.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No comments yet.</div>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    className={s.input}
                    placeholder="Add a comment…"
                    onKeyDown={e => e.key === 'Enter' && postComment()}
                    disabled={posting}
                />
                <button className={s.btnPrimary} onClick={postComment} disabled={posting || !msg.trim()}>
                    {posting ? '…' : 'Post'}
                </button>
            </div>
        </div>
    );
}

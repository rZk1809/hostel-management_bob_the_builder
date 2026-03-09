import { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { fmtDate } from '../utils';
import s from '../styles/dashboard.module.css';

const ROLE_COLORS = {
    admin:       { color: 'var(--danger)',   bg: 'var(--danger-dim)' },
    warden:      { color: 'var(--accent)',   bg: 'var(--accent-dim)' },
    maintenance: { color: 'var(--open)',     bg: 'var(--open-dim)' },
    student:     { color: 'var(--resolved)', bg: 'var(--resolved-dim)' },
};

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
            await api.addComment(complaintId, msg.trim());
            setMsg('');
            load();
        } catch (e) {
            toast.error(e.message || 'Failed to post comment');
        } finally {
            setPosting(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            postComment();
        }
    };

    return (
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', marginBottom: '1rem' }}>
                <MessageSquare size={14} color="var(--muted)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)' }}>
                    Comments
                </span>
                {!loading && (
                    <span style={{
                        fontSize: '0.68rem', fontWeight: 600,
                        background: 'var(--surface-2)', color: 'var(--muted)',
                        padding: '1px 6px', borderRadius: 99,
                    }}>
                        {comments.length}
                    </span>
                )}
            </div>

            {/* Comment list */}
            {loading ? (
                <div style={{ fontSize: '0.825rem', color: 'var(--muted)', padding: '0.75rem 0' }}>
                    Loading comments…
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.125rem' }}>
                    {comments.map(c => {
                        const roleStyle = ROLE_COLORS[c.user?.role] || ROLE_COLORS.student;
                        return (
                            <div key={c.id} style={{
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--r)',
                                padding: '0.75rem 0.875rem',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                                            {c.user?.name}
                                        </span>
                                        <span style={{
                                            fontSize: '0.62rem', fontWeight: 600,
                                            padding: '1px 6px', borderRadius: 99,
                                            textTransform: 'capitalize',
                                            background: roleStyle.bg, color: roleStyle.color,
                                        }}>
                                            {c.user?.role}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                                        {fmtDate(c.createdAt)}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.845rem', color: 'var(--text)', lineHeight: 1.55 }}>
                                    {c.message}
                                </p>
                            </div>
                        );
                    })}
                    {comments.length === 0 && (
                        <div style={{ fontSize: '0.8375rem', color: 'var(--muted)', padding: '0.5rem 0' }}>
                            No comments yet. Be the first to add one.
                        </div>
                    )}
                </div>
            )}

            {/* Input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={handleKey}
                    className={s.input}
                    placeholder="Add a comment… (Enter to post)"
                    disabled={posting}
                    style={{ flex: 1 }}
                />
                <button
                    className={s.btnPrimary}
                    onClick={postComment}
                    disabled={posting || !msg.trim()}
                    style={{ padding: '0.5rem 0.875rem', flexShrink: 0 }}
                    aria-label="Post comment"
                >
                    <Send size={13} />
                    {posting ? '…' : 'Post'}
                </button>
            </div>
        </div>
    );
}

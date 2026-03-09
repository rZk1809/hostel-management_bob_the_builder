import s from '../styles/dashboard.module.css';

export default function Pagination({ pagination, onPageChange }) {
    if (!pagination || pagination.pages <= 1) return null;

    const { page, pages, hasNextPage, hasPrevPage } = pagination;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem 0' }}>
            <button
                className={s.btnGhost}
                disabled={!hasPrevPage}
                onClick={() => onPageChange(page - 1)}
                style={{ padding: '6px 14px', opacity: hasPrevPage ? 1 : 0.4, cursor: hasPrevPage ? 'pointer' : 'not-allowed' }}
            >
                ← Prev
            </button>

            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>
                Page {page} of {pages}
            </span>

            <button
                className={s.btnGhost}
                disabled={!hasNextPage}
                onClick={() => onPageChange(page + 1)}
                style={{ padding: '6px 14px', opacity: hasNextPage ? 1 : 0.4, cursor: hasNextPage ? 'pointer' : 'not-allowed' }}
            >
                Next →
            </button>
        </div>
    );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';
import s from '../styles/dashboard.module.css';

export default function Pagination({ pagination, onPageChange }) {
    if (!pagination || pagination.pages <= 1) return null;

    const { page, pages, hasNextPage, hasPrevPage } = pagination;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', paddingTop: '1.25rem',
        }}>
            <button
                className={s.btnGhost}
                disabled={!hasPrevPage}
                onClick={() => onPageChange(page - 1)}
                style={{ opacity: hasPrevPage ? 1 : 0.35, cursor: hasPrevPage ? 'pointer' : 'not-allowed' }}
            >
                <ChevronLeft size={14} /> Prev
            </button>

            <span style={{
                fontSize: '0.8rem', color: 'var(--muted)',
                fontFamily: 'DM Mono, monospace',
            }}>
                {page} / {pages}
            </span>

            <button
                className={s.btnGhost}
                disabled={!hasNextPage}
                onClick={() => onPageChange(page + 1)}
                style={{ opacity: hasNextPage ? 1 : 0.35, cursor: hasNextPage ? 'pointer' : 'not-allowed' }}
            >
                Next <ChevronRight size={14} />
            </button>
        </div>
    );
}

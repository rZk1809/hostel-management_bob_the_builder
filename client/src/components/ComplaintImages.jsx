import { ImageIcon } from 'lucide-react';
import { HOST_URL } from '../api';

export default function ComplaintImages({ images }) {
    if (!images || images.length === 0) return null;

    return (
        <div style={{ marginTop: '1.25rem' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.7rem', color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                fontWeight: 600, marginBottom: '0.625rem',
            }}>
                <ImageIcon size={11} />
                Attachments ({images.length})
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                {images.map((url, i) => (
                    <a
                        key={i}
                        href={`${HOST_URL}${url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'block',
                            borderRadius: 'var(--r)',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            transition: 'border-color 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                        <img
                            src={`${HOST_URL}${url}`}
                            alt={`Attachment ${i + 1}`}
                            style={{
                                width: '110px', height: '110px',
                                objectFit: 'cover', display: 'block',
                            }}
                        />
                    </a>
                ))}
            </div>
        </div>
    );
}

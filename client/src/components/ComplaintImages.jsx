import { HOST_URL } from '../api';

export default function ComplaintImages({ images }) {
    if (!images || images.length === 0) return null;

    return (
        <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '0.5rem' }}>Attachments</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {images.map((url, i) => (
                    <a key={i} href={`${HOST_URL}${url}`} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={`${HOST_URL}${url}`} alt="Attachment" style={{ width: '120px', height: '120px', objectFit: 'cover', display: 'block' }} />
                    </a>
                ))}
            </div>
        </div>
    );
}

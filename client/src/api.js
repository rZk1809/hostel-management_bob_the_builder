const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Server root URL (for serving uploaded files from /uploads/*)
export const HOST_URL = BASE.replace(/\/api$/, '');

async function req(path, options = {}) {
    const userInfo = localStorage.getItem('userInfo');
    const headers = { 'Content-Type': 'application/json' };

    if (userInfo) {
        try {
            const { token } = JSON.parse(userInfo);
            headers['Authorization'] = `Bearer ${token}`;
        } catch { /* corrupt storage */ }
    }

    const res = await fetch(`${BASE}${path}`, { headers, ...options });

    if (!res.ok) {
        let err = 'An error occurred.';
        try { const d = await res.json(); err = d.error || err; } catch { err = res.statusText || err; }
        const error = new Error(err);
        error.status = res.status;
        throw error;
    }
    return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    login:      (data) => req('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
    register:   (data) => req('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: ()     => req('/auth/profile'),
};

// ── Complaints ────────────────────────────────────────────────────────────────
export const api = {
    login:    authApi.login,
    register: authApi.register,

    getComplaints: (filters = {}, page = 1, limit = 20) => {
        const params = new URLSearchParams(
            Object.fromEntries(Object.entries({ ...filters, page, limit }).filter(([, v]) => v))
        );
        return req(`/complaints?${params}`);
    },
    getComplaint:     (id)       => req(`/complaints/${id}`),
    createComplaint:  (data)     => req('/complaints',       { method: 'POST',  body: JSON.stringify(data) }),
    updateComplaint:  (id, data) => req(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteComplaint:  (id)       => req(`/complaints/${id}`, { method: 'DELETE' }),
    assignComplaint:  (id, data) => req(`/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify(data) }),
    getStats: () => req('/stats'),

    // ── Comments & Uploads ──────────────────────────────────────────────────
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const userInfo = localStorage.getItem('userInfo');
        const headers = {};
        if (userInfo) {
            try { headers['Authorization'] = `Bearer ${JSON.parse(userInfo).token}`; } catch { }
        }
        const res = await fetch(`${BASE}/upload`, { method: 'POST', headers, body: formData });
        if (!res.ok) {
            let err = 'Upload failed';
            try { const d = await res.json(); err = d.error || err; } catch { }
            throw new Error(err);
        }
        return res.json();
    },
    getComments: (id)       => req(`/comments/${id}`),
    addComment:  (id, msg)  => req(`/comments/${id}`, { method: 'POST', body: JSON.stringify({ message: msg }) }),

    // ── Admin ────────────────────────────────────────────────────────────────
    getAnalytics: () => req('/admin/analytics'),
    getUsers: (filters = {}) => {
        const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
        return req(`/admin/users?${params}`);
    },
    getUserById:      (id)        => req(`/admin/users/${id}`),
    updateUserRole:   (id, role)  => req(`/admin/users/${id}/role`,   { method: 'PATCH', body: JSON.stringify({ role }) }),
    toggleUserStatus: (id)        => req(`/admin/users/${id}/status`, { method: 'PATCH' }),
};

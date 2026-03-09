import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AppLayout.module.css';

// Navigation items per role
const NAV_CONFIG = {
    student: [
        { id: 'my-complaints', label: 'My Complaints', icon: '📋' },
        { id: 'new-complaint', label: 'New Complaint', icon: '➕' },
        { id: 'profile', label: 'My Profile', icon: '👤' },
    ],
    warden: [
        { id: 'all-complaints', label: 'All Complaints', icon: '📋', section: 'Complaints' },
        { id: 'assign', label: 'Assign Tasks', icon: '👷', section: 'Complaints' },
        { id: 'analytics', label: 'Analytics', icon: '📊', section: 'Insights' },
        { id: 'profile', label: 'My Profile', icon: '👤', section: 'Account' },
    ],
    admin: [
        { id: 'all-complaints', label: 'All Complaints', icon: '📋', section: 'Complaints' },
        { id: 'analytics', label: 'Analytics', icon: '📊', section: 'Insights' },
        { id: 'users', label: 'User Management', icon: '👥', section: 'Admin' },
        { id: 'profile', label: 'My Profile', icon: '👤', section: 'Account' },
    ],
    maintenance: [
        { id: 'assigned', label: 'Assigned Tasks', icon: '🔧' },
        { id: 'profile', label: 'My Profile', icon: '👤' },
    ],
};

export default function AppLayout({ activePage, onNavigate, title, children }) {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = NAV_CONFIG[user?.role] || NAV_CONFIG.student;

    // Group by section for warden/admin
    const grouped = navItems.reduce((acc, item) => {
        const key = item.section || '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div className={styles.root}>
            {/* Sidebar */}
            <nav className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                <div className={styles.brand}>
                    <span className={styles.brandIcon}>🏠</span>
                    <div className={styles.brandText}>
                        <span className={styles.brandTitle}>HostelDesk</span>
                        <span className={styles.brandSub}>Complaint Portal</span>
                    </div>
                </div>

                <div className={styles.nav}>
                    {Object.entries(grouped).map(([section, items]) => (
                        <div key={section}>
                            {section && <div className={styles.navSectionLabel}>{section}</div>}
                            {items.map(item => (
                                <button
                                    key={item.id}
                                    className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
                                    onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userCard}>
                        <div className={styles.avatar}>{initials}</div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user?.name}</div>
                            <div className={styles.userRole}>{user?.role}</div>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={logout}>
                        🚪 Logout
                    </button>
                </div>
            </nav>

            {/* Main content */}
            <div className={styles.content}>
                <header className={styles.topbar}>
                    {/* Mobile hamburger */}
                    <button
                        style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer', display: 'none' }}
                        onClick={() => setSidebarOpen(s => !s)}
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>
                    <span className={styles.topbarTitle}>{title}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {user?.roomNumber ? `Room ${user.roomNumber}` : ''}
                    </div>
                </header>
                <main className={styles.page}>
                    {children}
                </main>
            </div>
        </div>
    );
}

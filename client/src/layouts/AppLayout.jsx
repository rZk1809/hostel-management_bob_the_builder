import { useState } from 'react';
import {
    FileText, PlusCircle, User, Users, BarChart3,
    Wrench, LogOut, Menu, X, Sun, Moon, Home,
    ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './AppLayout.module.css';

const NAV_CONFIG = {
    student: [
        { id: 'my-complaints', label: 'My Complaints',  icon: FileText },
        { id: 'new-complaint', label: 'New Complaint',   icon: PlusCircle },
        { id: 'profile',       label: 'My Profile',      icon: User },
    ],
    warden: [
        { id: 'all-complaints', label: 'All Complaints', icon: FileText,  section: 'Complaints' },
        { id: 'analytics',      label: 'Analytics',      icon: BarChart3, section: 'Insights' },
        { id: 'profile',        label: 'My Profile',     icon: User,      section: 'Account' },
    ],
    admin: [
        { id: 'all-complaints', label: 'All Complaints', icon: FileText,      section: 'Complaints' },
        { id: 'analytics',      label: 'Analytics',      icon: BarChart3,     section: 'Insights' },
        { id: 'users',          label: 'User Management',icon: Users,         section: 'Admin' },
        { id: 'profile',        label: 'My Profile',     icon: User,          section: 'Account' },
    ],
    maintenance: [
        { id: 'assigned', label: 'Assigned Tasks', icon: ClipboardList },
        { id: 'profile',  label: 'My Profile',     icon: User },
    ],
};

const ROLE_STYLE = {
    admin:       { background: 'var(--danger-dim)',    color: 'var(--danger)' },
    warden:      { background: 'var(--accent-dim)',    color: 'var(--accent)' },
    maintenance: { background: 'var(--open-dim)',      color: 'var(--open)' },
    student:     { background: 'var(--resolved-dim)',  color: 'var(--resolved)' },
};

export default function AppLayout({ activePage, onNavigate, title, children }) {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = NAV_CONFIG[user?.role] || NAV_CONFIG.student;
    const roleStyle = ROLE_STYLE[user?.role] || ROLE_STYLE.student;

    const grouped = navItems.reduce((acc, item) => {
        const key = item.section || '_';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    const handleNav = (id) => {
        onNavigate(id);
        setSidebarOpen(false);
    };

    return (
        <div className={styles.root}>
            {sidebarOpen && (
                <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ───────────────────────────────────────────── */}
            <nav className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.brand}>
                    <div className={styles.brandLogo}>
                        <Home size={14} />
                    </div>
                    <div className={styles.brandText}>
                        <span className={styles.brandTitle}>HostelDesk</span>
                        <span className={styles.brandSub}>Complaint Portal</span>
                    </div>
                    <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Close">
                        <X size={15} />
                    </button>
                </div>

                <div className={styles.nav}>
                    {Object.entries(grouped).map(([section, items]) => (
                        <div key={section} className={styles.navGroup}>
                            {section !== '_' && (
                                <div className={styles.navSectionLabel}>{section}</div>
                            )}
                            {items.map(item => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
                                        onClick={() => handleNav(item.id)}
                                    >
                                        <Icon size={14} className={styles.navIcon} strokeWidth={2} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userCard}>
                        <div className={styles.avatar}>{initials}</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name}</span>
                            <span className={styles.userRoleBadge} style={roleStyle}>
                                {user?.role}
                            </span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={logout}>
                        <LogOut size={13} strokeWidth={2} />
                        Sign out
                    </button>
                </div>
            </nav>

            {/* ── Main content ──────────────────────────────────────── */}
            <div className={styles.content}>
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <button
                            className={styles.hamburger}
                            onClick={() => setSidebarOpen(s => !s)}
                            aria-label="Toggle navigation"
                        >
                            <Menu size={17} strokeWidth={2} />
                        </button>
                        <h1 className={styles.topbarTitle}>{title}</h1>
                    </div>
                    <div className={styles.topbarRight}>
                        {user?.roomNumber && (
                            <span className={styles.roomTag}>Room {user.roomNumber}</span>
                        )}
                        <button
                            className={styles.themeBtn}
                            onClick={toggle}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
                        </button>
                    </div>
                </header>

                <main className={styles.page}>
                    {children}
                </main>
            </div>
        </div>
    );
}

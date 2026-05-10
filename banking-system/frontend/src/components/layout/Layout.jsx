import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useTheme from '../../hooks/useTheme'
import Avatar from '../ui/Avatar.jsx'
import NotificationBell from '../ui/NotificationBell.jsx'
import GlobalSearch from '../ui/GlobalSearch.jsx'
import styles from './Layout.module.css'

export default function Layout() {
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const nav = [
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/projects', icon: '◫', label: 'Projects' },
    { to: '/tasks', icon: '✓', label: 'Tasks' },
    { to: '/analytics', icon: '◈', label: 'Analytics' },
    ...(isAdmin() ? [{ to: '/team', icon: '◎', label: 'Team' }] : []),
  ]

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>TM</div>
            {!collapsed && <span className={styles.brandName}>TaskFlow</span>}
          </div>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className={styles.nav}>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <NavLink
            to="/profile"
            className={({ isActive }) => `${styles.profileLink} ${isActive ? styles.active : ''}`}
          >
            <Avatar name={user?.name} size={28} />
            {!collapsed && (
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{user?.name}</div>
                <div className={styles.profileRole}>{user?.role === 'admin' ? 'Admin' : 'Member'}</div>
              </div>
            )}
          </NavLink>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">⏻</button>
        </div>
      </aside>

      <div className={styles.mainWrap}>
        <div className={styles.topbar}>
          <GlobalSearch />
          <div className={styles.topbarRight}>
            <button
              onClick={toggle}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                background: 'none', border: '0.5px solid var(--border2)',
                borderRadius: 8, width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 15, color: 'var(--text2)',
              }}
            >
              {theme === 'dark' ? '☀' : '◑'}
            </button>
            <NotificationBell />
          </div>
        </div>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useNotifications from '../../hooks/useNotifications'
import { format, formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { unreadCount, notifications, loading, fetchAll, markRead, markAllRead, clearAll } = useNotifications()

  useEffect(() => {
    if (open) fetchAll()
  }, [open])

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = async (n) => {
    if (!n.read) await markRead(n._id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const typeIcon = {
    task_assigned: '📋',
    task_status_changed: '🔄',
    task_overdue: '⚠️',
    comment_added: '💬',
    project_added: '📁',
    project_member_added: '👥',
    role_changed: '🔑',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'none', border: '0.5px solid var(--border2)',
          borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)',
          transition: 'all 0.15s',
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--red)', color: 'white',
            borderRadius: '50%', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, border: '2px solid var(--bg)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42, width: 340,
          background: 'var(--bg2)', border: '0.5px solid var(--border2)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Notifications {unreadCount > 0 && <span style={{ fontSize: 11, background: 'var(--red)', color: 'white', borderRadius: 10, padding: '1px 6px', marginLeft: 4 }}>{unreadCount}</span>}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--blue)', cursor: 'pointer' }}>Mark all read</button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text3)', cursor: 'pointer' }}>Clear all</button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                <div style={{ fontSize: 13 }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 14px',
                    borderBottom: '0.5px solid var(--border)',
                    background: n.read ? 'transparent' : 'rgba(88,166,255,0.04)',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(88,166,255,0.04)'}
                >
                  <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{typeIcon[n.type] || '📌'}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4, marginBottom: 3 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                      {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 5 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

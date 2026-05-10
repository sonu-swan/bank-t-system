import React, { useEffect, useState } from 'react'
import { teamAPI } from '../api'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { Modal, showToast } from '../components/ui/index.jsx'
import useAuthStore from '../store/authStore'

export default function TeamPage() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  const load = () => teamAPI.getAll().then(r => setMembers(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleRoleChange = async (id, newRole) => {
    try {
      await teamAPI.changeRole(id, newRole)
      showToast(`Role updated to ${newRole}`)
      load()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Deactivate ${name}? They will lose access immediately.`)) return
    try {
      await teamAPI.deactivate(id)
      showToast(`${name} deactivated`)
      load()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={36} /></div>

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Team</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowInvite(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>+ Invite member</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Total members</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{members.length}</div>
        </div>
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Admins</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--purple)' }}>{members.filter(m => m.role === 'admin').length}</div>
        </div>
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Total tasks assigned</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--blue)' }}>{members.reduce((a, m) => a + (m.tasksAssigned || 0), 0)}</div>
        </div>
      </div>

      {/* Members list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map(m => {
          const isSelf = m._id === user?._id
          const completionRate = m.tasksAssigned > 0 ? Math.round(m.tasksCompleted / m.tasksAssigned * 100) : 0
          return (
            <div key={m._id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar name={m.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                  {isSelf && <span style={{ fontSize: 10, background: 'var(--bg3)', color: 'var(--text2)', padding: '1px 6px', borderRadius: 4 }}>You</span>}
                  <Badge variant={m.role}>{m.role}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{m.email}</div>
                <div style={{ display: 'flex', align: 'center', gap: 16, fontSize: 11, color: 'var(--text3)' }}>
                  <span>{m.tasksAssigned} assigned</span>
                  <span style={{ color: 'var(--accent)' }}>{m.tasksCompleted} completed</span>
                  <span>{completionRate}% rate</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: 80 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, textAlign: 'right' }}>{completionRate}%</div>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${completionRate}%`, background: 'var(--accent)', borderRadius: 2 }} />
                </div>
              </div>

              {/* Actions */}
              {!isSelf && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleRoleChange(m._id, m.role === 'admin' ? 'member' : 'admin')}
                    style={{ background: 'none', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>
                    {m.role === 'admin' ? 'Make member' : 'Make admin'}
                  </button>
                  <button
                    onClick={() => handleDeactivate(m._id, m.name)}
                    style={{ background: 'none', border: '0.5px solid var(--red)', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: 'var(--red)', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite team member">
        <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 12 }}>To invite a new member, share this registration link:</p>
          <div style={{ background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--blue)', wordBreak: 'break-all' }}>
            {window.location.origin}/register
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>They can register with any role. You can change their role here after they join.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/register'); showToast('Link copied!') }}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>
            Copy link
          </button>
        </div>
      </Modal>
    </div>
  )
}

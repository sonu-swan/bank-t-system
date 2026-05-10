import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { authAPI, exportAPI } from '../api'
import api from '../api'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import { showToast } from '../components/ui/index.jsx'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, updateUser, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const [nameForm, setNameForm] = useState({ name: user?.name || '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingName, setSavingName] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [runningCheck, setRunningCheck] = useState(false)

  const handleSaveName = async e => {
    e.preventDefault()
    setSavingName(true)
    try {
      const { data } = await authAPI.updateMe({ name: nameForm.name })
      updateUser(data.data)
      showToast('Profile updated!')
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSavingName(false) }
  }

  const handleChangePassword = async e => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirm) { showToast('Passwords do not match', 'error'); return }
    if (passForm.newPassword.length < 8) { showToast('Password must be 8+ characters', 'error'); return }
    setSavingPass(true)
    try {
      await authAPI.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
      showToast('Password changed!')
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSavingPass(false) }
  }

  const handleOverdueCheck = async () => {
    setRunningCheck(true)
    try {
      const { data } = await api.post('/internal/run-overdue-check')
      showToast(data.message)
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setRunningCheck(false) }
  }

  const inp = { width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }
  const lbl = { display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 580 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Profile</h1>

      {/* Profile card */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar name={user?.name} size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge variant={user?.role}>{user?.role}</Badge>
            {user?.lastLogin && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Last login: {format(new Date(user.lastLogin), 'dd MMM yyyy, HH:mm')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Edit name */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Edit profile</h2>
        <form onSubmit={handleSaveName}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Display name</label>
            <input value={nameForm.name} onChange={e => setNameForm({ name: e.target.value })} required style={inp} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Email address</label>
            <input value={user?.email} disabled style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <button type="submit" disabled={savingName}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>
            {savingName ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Change password</h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Current password</label>
            <input type="password" value={passForm.currentPassword} onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} required style={inp} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>New password</label>
            <input type="password" value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} required placeholder="Min 8 characters" style={inp} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Confirm new password</label>
            <input type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} required style={inp} />
          </div>
          <button type="submit" disabled={savingPass}
            style={{ background: 'none', border: '0.5px solid var(--blue)', borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 500, color: 'var(--blue)', cursor: 'pointer' }}>
            {savingPass ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Admin tools */}
      {isAdmin() && (
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Admin tools</h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>Utilities for managing the workspace</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Run overdue check</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Send notifications for all overdue tasks</div>
              </div>
              <button onClick={handleOverdueCheck} disabled={runningCheck}
                style={{ background: 'none', border: '0.5px solid var(--amber)', borderRadius: 7, padding: '6px 14px', fontSize: 12, color: 'var(--amber)', cursor: 'pointer', flexShrink: 0 }}>
                {runningCheck ? 'Running...' : '▶ Run now'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Export all tasks</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Download CSV of all tasks across projects</div>
              </div>
              <button onClick={() => { exportAPI.tasksCSV(); showToast('Download started!') }}
                style={{ background: 'none', border: '0.5px solid var(--accent)', borderRadius: 7, padding: '6px 14px', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}>
                ↧ Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid rgba(248,81,73,0.2)', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--red)' }}>Sign out</h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>End your current session</p>
        <button onClick={() => { logout(); navigate('/login') }}
          style={{ background: 'none', border: '0.5px solid var(--red)', borderRadius: 7, padding: '8px 18px', fontSize: 13, color: 'var(--red)', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}

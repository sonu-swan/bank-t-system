import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { showToast } from '../components/ui/index.jsx'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 8) { showToast('Password must be at least 8 characters', 'error'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.role)
      navigate('/dashboard')
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error')
    } finally { setLoading(false) }
  }

  const inputStyle = { width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: 'var(--text)', outline: 'none' }
  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0d1117' }}>TM</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>TaskFlow</div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Create account</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Join your team on TaskFlow</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Full name</label><input value={form.name} onChange={set('name')} required placeholder="Rohan Gupta" style={inputStyle} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={set('email')} required placeholder="rohan@company.com" style={inputStyle} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Password</label><input type="password" value={form.password} onChange={set('password')} required placeholder="Min 8 characters" style={inputStyle} /></div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['admin', 'member'].map(r => (
                  <div key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                    style={{ padding: '12px 8px', textAlign: 'center', border: `0.5px solid ${form.role === r ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 8, cursor: 'pointer', background: form.role === r ? 'rgba(63,185,80,.08)' : 'var(--bg3)' }}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{r === 'admin' ? '👑' : '👤'}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' }}>{r}</div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, color: '#0d1117', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 16 }}>
            Have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

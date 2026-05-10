import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { showToast } from '../components/ui/index.jsx'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error')
    } finally { setLoading(false) }
  }

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@taskflow.io', password: 'demo1234' })
    else setForm({ email: 'arjun@taskflow.io', password: 'demo1234' })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0d1117' }}>TM</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>TaskFlow</div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="you@company.com"
                style={{ width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} required placeholder="••••••••"
                style={{ width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, color: '#0d1117', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: 12, background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Demo accounts</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => fillDemo('admin')} style={{ flex: 1, background: 'rgba(63,185,80,.1)', border: '0.5px solid rgba(63,185,80,.3)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>
                👑 Admin
              </button>
              <button onClick={() => fillDemo('member')} style={{ flex: 1, background: 'rgba(88,166,255,.1)', border: '0.5px solid rgba(88,166,255,.3)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: 'var(--blue)', cursor: 'pointer' }}>
                👤 Member
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 16 }}>
            No account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

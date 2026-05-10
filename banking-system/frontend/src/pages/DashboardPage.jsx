import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI, projectAPI } from '../api'
import useAuthStore from '../store/authStore'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { format, isAfter } from 'date-fns'

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--text)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const [dash, setDash] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([taskAPI.getDashboard(), projectAPI.getAll()])
      .then(([d, p]) => { setDash(d.data.data); setProjects(p.data.data.slice(0, 4)) })
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 }}>
      <LoadingSpinner size={36} />
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Avatar name={user?.name} size={36} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600 }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="My tasks" value={dash?.totalAssigned || 0} sub="assigned to you" />
        <StatCard label="In progress" value={dash?.statusCounts?.['in-progress'] || 0} color="var(--blue)" sub="active right now" />
        <StatCard label="Overdue" value={dash?.overdueCount || 0} color="var(--red)" sub="need attention" />
        <StatCard label="Completed" value={dash?.statusCounts?.done || 0} color="var(--accent)" sub="total done" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Overdue tasks */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            ⚠ Overdue tasks
          </div>
          {dash?.overdueTasks?.length ? dash.overdueTasks.map(t => (
            <div key={t._id} onClick={() => navigate(`/tasks/${t._id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12 }}>{t.title}</div>
              <div style={{ fontSize: 10, background: t.project?.color + '20', color: t.project?.color, padding: '2px 6px', borderRadius: 4 }}>{t.project?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--red)' }}>{t.dueDate ? format(new Date(t.dueDate), 'dd MMM') : ''}</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text2)', fontSize: 13 }}>
              ✅ No overdue tasks!
            </div>
          )}
        </div>

        {/* Projects overview */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            Projects progress
          </div>
          {projects.length ? projects.map(p => {
            const pct = p.taskCount ? Math.round(p.completedCount / p.taskCount * 100) : 0
            return (
              <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)}
                style={{ marginBottom: 14, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                  </div>
                  <span style={{ color: 'var(--text2)' }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{p.completedCount}/{p.taskCount} tasks done</div>
              </div>
            )
          }) : <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text2)', fontSize: 13 }}>No projects yet</div>}
        </div>

        {/* Recently completed */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            ✓ Recently completed
          </div>
          {dash?.recentDone?.length ? dash.recentDone.map(t => (
            <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'var(--accent)', flexShrink: 0 }}>✓</div>
              <div style={{ flex: 1, fontSize: 12 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.completedAt ? format(new Date(t.completedAt), 'dd MMM') : ''}</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text2)', fontSize: 13 }}>No completed tasks yet</div>
          )}
        </div>

        {/* Task status breakdown */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            Task breakdown
          </div>
          {[
            { key: 'todo', label: 'To do', color: 'var(--text2)' },
            { key: 'in-progress', label: 'In progress', color: 'var(--blue)' },
            { key: 'in-review', label: 'In review', color: 'var(--purple)' },
            { key: 'done', label: 'Done', color: 'var(--accent)' },
          ].map(s => {
            const count = dash?.statusCounts?.[s.key] || 0
            const total = dash?.totalAssigned || 1
            const pct = Math.round(count / total * 100)
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 12, width: 80, color: s.color, flexShrink: 0 }}>{s.label}</div>
                <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

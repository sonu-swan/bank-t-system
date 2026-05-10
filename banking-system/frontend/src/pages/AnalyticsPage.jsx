import React, { useEffect, useState } from 'react'
import { analyticsAPI, exportAPI, projectAPI } from '../api'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { showToast } from '../components/ui/index.jsx'
import useAuthStore from '../store/authStore'

function MiniBar({ value, max, color, label, count }) {
  const pct = max > 0 ? Math.round(value / max * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text2)' }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function StatTile({ label, value, color, sub }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: color || 'var(--text)', marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

function SparkLine({ data, color = '#3fb950' }) {
  if (!data || data.length === 0) return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 12 }}>No data</div>

  const max = Math.max(...data.map(d => d.count), 1)
  const W = 340, H = 60, PAD = 8

  const points = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2)
    const y = H - PAD - (d.count / max) * (H - PAD * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 60 }}>
      <polygon points={areaPoints} fill={color + '20'} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2)
        const y = H - PAD - (d.count / max) * (H - PAD * 2)
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />
      })}
    </svg>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [exportProject, setExportProject] = useState('')
  const { isAdmin } = useAuthStore()

  useEffect(() => {
    Promise.all([analyticsAPI.getOverview(), projectAPI.getAll()])
      .then(([a, p]) => { setData(a.data.data); setProjects(p.data.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleExport = () => {
    exportAPI.tasksCSV(exportProject || undefined)
    showToast('CSV download started!')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={36} /></div>

  const { summary, byPriority, byStatus, completedByDay, topAssignees, projectHealth } = data

  const priorityColors = { low: '#3fb950', medium: '#e3b341', high: '#f85149', urgent: '#ff6b35' }
  const statusColors = { todo: '#8b949e', 'in-progress': '#58a6ff', 'in-review': '#bc8cff', done: '#3fb950' }
  const maxPriority = Math.max(...Object.values(byPriority), 1)
  const maxStatus = Math.max(...Object.values(byStatus), 1)

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Task and project health overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={exportProject} onChange={e => setExportProject(e.target.value)}
            style={{ background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '6px 10px', fontSize: 12, color: 'var(--text)', outline: 'none', cursor: 'pointer' }}>
            <option value="">All projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button onClick={handleExport}
            style={{ background: 'none', border: '0.5px solid var(--accent)', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 500, color: 'var(--accent)', cursor: 'pointer' }}>
            ↧ Export CSV
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatTile label="Total tasks" value={summary.totalTasks} />
        <StatTile label="Completion rate" value={`${summary.completionRate}%`} color="var(--accent)" sub={`${summary.doneTasks} done`} />
        <StatTile label="Overdue tasks" value={summary.overdueTasks} color={summary.overdueTasks > 0 ? 'var(--red)' : 'var(--text)'} sub="need attention" />
        <StatTile label="Done last 30 days" value={summary.completedLast30} color="var(--blue)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatTile label="Created this week" value={summary.createdLast7} sub="new tasks" />
        <StatTile label="Completed this week" value={summary.completedLast7} color="var(--accent)" sub="finished tasks" />
        <StatTile label="Velocity" value={summary.completedLast7 > 0 ? `${Math.round(summary.completedLast7 / 7 * 10) / 10}/day` : '—'} color="var(--purple)" sub="completions per day" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* By status */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>By status</div>
          {Object.entries(statusColors).map(([s, c]) => (
            <MiniBar key={s} label={s.replace('-', ' ')} count={byStatus[s] || 0} value={byStatus[s] || 0} max={maxStatus} color={c} />
          ))}
        </div>

        {/* By priority */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>By priority</div>
          {Object.entries(priorityColors).map(([p, c]) => (
            <MiniBar key={p} label={p} count={byPriority[p] || 0} value={byPriority[p] || 0} max={maxPriority} color={c} />
          ))}
        </div>

        {/* Top assignees */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Top contributors</div>
          {topAssignees.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>No data yet</div>
          ) : topAssignees.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: ['#3fb950','#58a6ff','#bc8cff','#e3b341','#f85149'][i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#0d1117', flexShrink: 0 }}>
                {a.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, fontSize: 12 }}>{a.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{a.count} ✓</div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion trend */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Completion trend (last 14 days)</div>
        <SparkLine data={completedByDay} color="var(--accent)" />
        {completedByDay.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
            <span>{completedByDay[0]?._id}</span>
            <span>{completedByDay[completedByDay.length - 1]?._id}</span>
          </div>
        )}
      </div>

      {/* Project health */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Project health</div>
        {projectHealth.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>No project data</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projectHealth.map((p, i) => {
              const pct = p.total > 0 ? Math.round(p.done / p.total * 100) : 0
              const health = p.overdue > 0 ? 'at-risk' : pct > 75 ? 'healthy' : pct > 40 ? 'progressing' : 'starting'
              const healthColor = { healthy: '#3fb950', progressing: '#58a6ff', 'at-risk': '#f85149', starting: '#8b949e' }[health]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color || '#888', flexShrink: 0 }} />
                  <div style={{ width: 140, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Unknown'}</div>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: p.color || '#888', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', width: 42, textAlign: 'right' }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', width: 60 }}>{p.done}/{p.total} done</div>
                  {p.overdue > 0 && <div style={{ fontSize: 11, color: 'var(--red)' }}>⚠ {p.overdue} late</div>}
                  <div style={{ fontSize: 10, color: healthColor, background: healthColor + '15', padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>{health}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI, projectAPI, teamAPI } from '../api'
import useAuthStore from '../store/authStore'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { Modal, showToast } from '../components/ui/index.jsx'
import { format } from 'date-fns'

const COLS = [
  { key: 'todo', label: 'To do', color: '#8b949e' },
  { key: 'in-progress', label: 'In progress', color: '#58a6ff' },
  { key: 'in-review', label: 'In review', color: '#bc8cff' },
  { key: 'done', label: 'Done', color: '#3fb950' },
]

export default function TasksPage() {
  const { isAdmin, user } = useAuthStore()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ project: '', priority: '', assignee: '', overdue: false })
  const [showNewTask, setShowNewTask] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', project: '', assignee: '', priority: 'medium', status: 'todo', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('board') // board | list

  const loadTasks = async () => {
    const params = {}
    if (filters.project) params.project = filters.project
    if (filters.priority) params.priority = filters.priority
    if (filters.assignee) params.assignee = filters.assignee
    if (filters.overdue) params.overdue = 'true'
    const { data } = await taskAPI.getAll(params)
    setTasks(data.data)
  }

  useEffect(() => {
    Promise.all([
      projectAPI.getAll(),
      isAdmin() ? teamAPI.getAll() : Promise.resolve({ data: { data: [] } })
    ]).then(([p, u]) => { setProjects(p.data.data); setAllUsers(u.data.data) })
  }, [])

  useEffect(() => {
    setLoading(true)
    loadTasks().finally(() => setLoading(false))
  }, [filters])

  const handleCreateTask = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await taskAPI.create(taskForm)
      showToast('Task created!')
      setShowNewTask(false)
      setTaskForm({ title: '', description: '', project: '', assignee: '', priority: 'medium', status: 'todo', dueDate: '' })
      loadTasks()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus })
      setTasks(ts => ts.map(t => t._id === taskId ? { ...t, status: newStatus } : t))
      showToast('Status updated')
    } catch (err) { showToast('Failed to update', 'error') }
  }

  const inp = { width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }
  const lbl = { display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const selStyle = { background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '6px 10px', fontSize: 12, color: 'var(--text)', outline: 'none', cursor: 'pointer' }

  const TaskCard = ({ task }) => {
    const isOverdue = task.isOverdue || (task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date())
    return (
      <div
        onClick={() => navigate(`/tasks/${task._id}`)}
        style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 8, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{task.title}</div>
        {task.project && <div style={{ fontSize: 10, color: task.project.color, marginBottom: 7, fontWeight: 500 }}>{task.project.name}</div>}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          <Badge variant={task.priority}>{task.priority}</Badge>
          {isOverdue && <Badge variant="overdue">Overdue</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {task.assignee ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Avatar name={task.assignee.name} size={18} />
              <span style={{ fontSize: 10, color: 'var(--text2)' }}>{task.assignee.name?.split(' ')[0]}</span>
            </div>
          ) : <span style={{ fontSize: 10, color: 'var(--text3)' }}>Unassigned</span>}
          {task.dueDate && <span style={{ fontSize: 10, color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>{format(new Date(task.dueDate), 'dd MMM')}</span>}
        </div>
        {isAdmin() && (
          <select
            value={task.status}
            onChange={e => { e.stopPropagation(); handleStatusUpdate(task._id, e.target.value) }}
            onClick={e => e.stopPropagation()}
            style={{ marginTop: 8, width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '4px 6px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="in-review">In review</option>
            <option value="done">Done</option>
          </select>
        )}
      </div>
    )
  }

  const projectMembersForForm = projects.find(p => p._id === taskForm.project)?.members || []

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Tasks</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 7, padding: 2, gap: 2 }}>
            {['board', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, border: 'none', background: view === v ? 'var(--bg3)' : 'none', color: view === v ? 'var(--text)' : 'var(--text2)', cursor: 'pointer' }}>
                {v === 'board' ? '⊞ Board' : '≡ List'}
              </button>
            ))}
          </div>
          {isAdmin() && (
            <button onClick={() => setShowNewTask(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>+ New task</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <select style={selStyle} value={filters.project} onChange={e => setFilters(f => ({ ...f, project: e.target.value }))}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select style={selStyle} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select style={selStyle} value={filters.assignee} onChange={e => setFilters(f => ({ ...f, assignee: e.target.value }))}>
          <option value="">All assignees</option>
          <option value="me">My tasks</option>
          {isAdmin() && allUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: filters.overdue ? 'var(--red)' : 'var(--text2)', cursor: 'pointer', padding: '6px 10px', background: 'var(--bg2)', border: `0.5px solid ${filters.overdue ? 'var(--red)' : 'var(--border2)'}`, borderRadius: 7 }}>
          <input type="checkbox" checked={filters.overdue} onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked }))} />
          Overdue only
        </label>
        {(filters.project || filters.priority || filters.assignee || filters.overdue) && (
          <button onClick={() => setFilters({ project: '', priority: '', assignee: '', overdue: false })} style={{ ...selStyle, color: 'var(--text2)', background: 'none' }}>Clear filters</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={32} /></div>
      ) : view === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key)
            return (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', background: 'var(--bg2)', borderRadius: 8, border: '0.5px solid var(--border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 10 }}>{colTasks.length}</span>
                </div>
                {colTasks.map(t => <TaskCard key={t._id} task={t} />)}
                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--text3)', fontSize: 11, border: '0.5px dashed var(--border)', borderRadius: 8 }}>No tasks</div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // List view
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasks.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)', fontSize: 13 }}>No tasks found</div>}
          {tasks.map(t => {
            const isOverdue = t.isOverdue || (t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date())
            return (
              <div key={t._id} onClick={() => navigate(`/tasks/${t._id}`)}
                style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLS.find(c => c.key === t.status)?.color, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                {t.project && <span style={{ fontSize: 11, color: t.project.color, background: t.project.color + '15', padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>{t.project.name}</span>}
                <Badge variant={t.priority}>{t.priority}</Badge>
                {isOverdue && <Badge variant="overdue">Overdue</Badge>}
                {t.assignee && <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}><Avatar name={t.assignee.name} size={22} /><span style={{ fontSize: 12, color: 'var(--text2)' }}>{t.assignee.name?.split(' ')[0]}</span></div>}
                {t.dueDate && <span style={{ fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text3)', flexShrink: 0 }}>{format(new Date(t.dueDate), 'dd MMM')}</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* New task modal */}
      <Modal open={showNewTask} onClose={() => setShowNewTask(false)} title="New task">
        <form onSubmit={handleCreateTask}>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Title *</label><input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" style={inp} /></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Description</label><textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Project *</label>
            <select required value={taskForm.project} onChange={e => setTaskForm(f => ({ ...f, project: e.target.value, assignee: '' }))} style={inp}>
              <option value="">Select project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Assignee</label>
              <select value={taskForm.assignee} onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))} style={inp}>
                <option value="">Unassigned</option>
                {(taskForm.project ? projectMembersForForm : allUsers).map(m => {
                  const u = m.user || m
                  return <option key={u._id} value={u._id}>{u.name}</option>
                })}
              </select>
            </div>
            <div><label style={lbl}>Priority</label>
              <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} style={inp}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div><label style={lbl}>Status</label>
              <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                <option value="todo">To do</option><option value="in-progress">In progress</option><option value="in-review">In review</option><option value="done">Done</option>
              </select>
            </div>
            <div><label style={lbl}>Due date</label><input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={() => setShowNewTask(false)} style={{ background: 'none', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '7px 14px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>{saving ? 'Creating...' : 'Create task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

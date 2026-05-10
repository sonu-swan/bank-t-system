import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectAPI, taskAPI, teamAPI } from '../api'
import useAuthStore from '../store/authStore'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { Modal, showToast } from '../components/ui/index.jsx'
import { format } from 'date-fns'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, user } = useAuthStore()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee: '', priority: 'medium', status: 'todo', dueDate: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [pd, st] = await Promise.all([projectAPI.getOne(id), projectAPI.getStats(id)])
      setProject(pd.data.data.project)
      setTasks(pd.data.data.tasks)
      setStats(st.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    if (isAdmin()) teamAPI.getAll().then(r => setAllUsers(r.data.data))
  }, [id])

  const handleAddMember = async () => {
    if (!selectedUserId) return
    setSaving(true)
    try {
      await projectAPI.addMember(id, { userId: selectedUserId })
      showToast('Member added!')
      setShowAddMember(false)
      setSelectedUserId('')
      load()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const handleRemoveMember = async uid => {
    if (!confirm('Remove this member from the project?')) return
    try {
      await projectAPI.removeMember(id, uid)
      showToast('Member removed')
      load()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const handleCreateTask = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await taskAPI.create({ ...taskForm, project: id })
      showToast('Task created!')
      setShowNewTask(false)
      setTaskForm({ title: '', description: '', assignee: '', priority: 'medium', status: 'todo', dueDate: '' })
      load()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDeleteProject = async () => {
    if (!confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) return
    try {
      await projectAPI.remove(id)
      showToast('Project deleted')
      navigate('/projects')
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const inp = { width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }
  const lbl = { display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={36} /></div>
  if (!project) return <div style={{ padding: 40, color: 'var(--text2)' }}>Project not found</div>

  const pct = (stats.done || 0) / (Object.values(stats).reduce((a, b) => typeof b === 'number' ? a + b : a, 0) - (stats.overdue || 0) || 1) * 100
  const statusCols = ['todo', 'in-progress', 'in-review', 'done']

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← Back to projects</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: project.color }} />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{project.name}</h1>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{project.description}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge variant={project.status}>{project.status}</Badge>
            {isAdmin() && (
              <button onClick={handleDeleteProject} style={{ background: 'none', border: '0.5px solid var(--red)', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: 'var(--red)', cursor: 'pointer' }}>Delete</button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'To do', val: stats.todo || 0, color: 'var(--text2)' },
          { label: 'In progress', val: stats['in-progress'] || 0, color: 'var(--blue)' },
          { label: 'In review', val: stats['in-review'] || 0, color: 'var(--purple)' },
          { label: 'Done', val: stats.done || 0, color: 'var(--accent)' },
          { label: 'Overdue', val: stats.overdue || 0, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Tasks board */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Tasks ({tasks.length})</h2>
            {isAdmin() && (
              <button onClick={() => setShowNewTask(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>+ New task</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {statusCols.map(col => {
              const colTasks = tasks.filter(t => t.status === col)
              const colColors = { todo: 'var(--text2)', 'in-progress': 'var(--blue)', 'in-review': 'var(--purple)', done: 'var(--accent)' }
              const colLabels = { todo: 'To do', 'in-progress': 'In progress', 'in-review': 'In review', done: 'Done' }
              return (
                <div key={col}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: colColors[col] }} />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{colLabels[col]}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 'auto' }}>{colTasks.length}</span>
                  </div>
                  {colTasks.map(t => {
                    const isOverdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()
                    return (
                      <div key={t._id} onClick={() => navigate(`/tasks/${t._id}`)}
                        style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 9, padding: 10, marginBottom: 7, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>{t.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <Badge variant={t.priority}>{t.priority}</Badge>
                          {isOverdue && <Badge variant="overdue">Overdue</Badge>}
                        </div>
                        {t.assignee && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
                            <Avatar name={t.assignee.name} size={16} />
                            <span style={{ fontSize: 10, color: 'var(--text2)' }}>{t.assignee.name?.split(' ')[0]}</span>
                          </div>
                        )}
                        {t.dueDate && <div style={{ fontSize: 10, color: isOverdue ? 'var(--red)' : 'var(--text3)', marginTop: 4 }}>{format(new Date(t.dueDate), 'dd MMM')}</div>}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Members sidebar */}
        <div>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Members ({project.members?.length})</span>
              {isAdmin() && <button onClick={() => setShowAddMember(true)} style={{ background: 'none', border: '0.5px solid var(--blue)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--blue)', cursor: 'pointer' }}>+ Add</button>}
            </div>
            {project.members?.map(m => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                <Avatar name={m.user?.name} size={28} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user?.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>{m.role}</div>
                </div>
                {isAdmin() && m.user?._id !== project.createdBy?._id && (
                  <button onClick={() => handleRemoveMember(m.user?._id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
                )}
              </div>
            ))}
          </div>

          {project.deadline && (
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deadline</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{format(new Date(project.deadline), 'dd MMM yyyy')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Add member modal */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Add member">
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Select user</label>
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={inp}>
            <option value="">-- Select a user --</option>
            {allUsers.filter(u2 => !project.members?.some(m => m.user?._id === u2._id)).map(u2 => (
              <option key={u2._id} value={u2._id}>{u2.name} ({u2.role})</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowAddMember(false)} style={{ background: 'none', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '7px 14px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleAddMember} disabled={saving || !selectedUserId} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>Add member</button>
        </div>
      </Modal>

      {/* New task modal */}
      <Modal open={showNewTask} onClose={() => setShowNewTask(false)} title="New task">
        <form onSubmit={handleCreateTask}>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Title *</label><input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" style={inp} /></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Description</label><textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Assignee</label>
              <select value={taskForm.assignee} onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))} style={inp}>
                <option value="">Unassigned</option>
                {project.members?.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Priority</label>
              <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} style={inp}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Status</label>
              <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="in-review">In review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}><label style={lbl}>Due date</label><input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={() => setShowNewTask(false)} style={{ background: 'none', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '7px 14px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>{saving ? 'Creating...' : 'Create task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

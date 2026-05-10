import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { taskAPI } from '../api'
import useAuthStore from '../store/authStore'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { showToast } from '../components/ui/index.jsx'
import { format } from 'date-fns'

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuthStore()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = () => taskAPI.getOne(id).then(r => {
    setTask(r.data.data)
    setEditForm({ status: r.data.data.status, priority: r.data.data.priority, assignee: r.data.data.assignee?._id || '' })
  }).finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const handleStatusChange = async newStatus => {
    try {
      await taskAPI.update(id, { status: newStatus })
      setTask(t => ({ ...t, status: newStatus }))
      showToast('Status updated')
    } catch { showToast('Failed to update status', 'error') }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const { data } = await taskAPI.update(id, editForm)
      setTask(data.data)
      setEditing(false)
      showToast('Task updated')
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const handleAddComment = async e => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmittingComment(true)
    try {
      const { data } = await taskAPI.addComment(id, { text: comment })
      setTask(t => ({ ...t, comments: [...(t.comments || []), { ...data.data, author: { _id: user._id, name: user.name } }] }))
      setComment('')
    } catch { showToast('Failed to add comment', 'error') }
    finally { setSubmittingComment(false) }
  }

  const handleDeleteComment = async cid => {
    try {
      await taskAPI.deleteComment(id, cid)
      setTask(t => ({ ...t, comments: t.comments.filter(c => c._id !== cid) }))
      showToast('Comment deleted')
    } catch { showToast('Failed', 'error') }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    try {
      await taskAPI.remove(id)
      showToast('Task deleted')
      navigate(-1)
    } catch { showToast('Failed to delete', 'error') }
  }

  const inp = { width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }
  const statusColors = { todo: '#8b949e', 'in-progress': '#58a6ff', 'in-review': '#bc8cff', done: '#3fb950' }
  const isOverdue = task && task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={36} /></div>
  if (!task) return <div style={{ padding: 40 }}>Task not found</div>

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Back</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        {/* Main */}
        <div>
          {/* Title + badges */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <h1 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.3, flex: 1, marginRight: 12 }}>{task.title}</h1>
              {(isAdmin() || task.createdBy?._id === user?._id) && (
                <button onClick={handleDelete} style={{ background: 'none', border: '0.5px solid var(--red)', borderRadius: 7, padding: '4px 10px', fontSize: 11, color: 'var(--red)', cursor: 'pointer', flexShrink: 0 }}>Delete</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <Badge variant={task.status}>{task.status.replace('-', ' ')}</Badge>
              <Badge variant={task.priority}>{task.priority}</Badge>
              {isOverdue && <Badge variant="overdue">Overdue</Badge>}
              {task.project && (
                <span style={{ fontSize: 11, background: task.project.color + '20', color: task.project.color, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{task.project.name}</span>
              )}
            </div>

            {task.description ? (
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{task.description}</p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>No description provided.</p>
            )}
          </div>

          {/* Status change (inline, quick) */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Move to</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(statusColors).map(([s, c]) => (
                <button key={s} onClick={() => handleStatusChange(s)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1px solid ${task.status === s ? c : 'var(--border2)'}`, background: task.status === s ? c + '20' : 'none', color: task.status === s ? c : 'var(--text2)', cursor: 'pointer' }}>
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Status history */}
          {task.statusHistory?.length > 1 && (
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Activity</div>
              {task.statusHistory.slice(-5).reverse().map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[h.to] || 'var(--text3)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text2)', flex: 1 }}>
                    {h.from ? `${h.from.replace('-', ' ')} → ${h.to.replace('-', ' ')}` : `Created as ${h.to}`}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{h.changedAt ? format(new Date(h.changedAt), 'dd MMM, HH:mm') : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
              Comments ({task.comments?.length || 0})
            </div>

            {task.comments?.map(c => (
              <div key={c._id} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                <Avatar name={c.author?.name} size={28} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{c.author?.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{c.createdAt ? format(new Date(c.createdAt), 'dd MMM, HH:mm') : ''}</span>
                    {(c.author?._id === user?._id || isAdmin()) && (
                      <button onClick={() => handleDeleteComment(c._id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, background: 'var(--bg3)', borderRadius: 8, padding: '8px 12px' }}>{c.text}</div>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 6 }}>
              <Avatar name={user?.name} size={28} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." rows={2}
                  style={{ ...inp, resize: 'none', marginBottom: 8 }} />
                <button type="submit" disabled={!comment.trim() || submittingComment}
                  style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#0d1117', cursor: 'pointer', opacity: (!comment.trim() || submittingComment) ? 0.6 : 1 }}>
                  Comment
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Details</div>

            <Detail label="Assignee">
              {task.assignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={task.assignee.name} size={22} />
                  <span style={{ fontSize: 13 }}>{task.assignee.name}</span>
                </div>
              ) : <span style={{ fontSize: 12, color: 'var(--text3)' }}>Unassigned</span>}
            </Detail>

            <Detail label="Created by">
              <span style={{ fontSize: 13 }}>{task.createdBy?.name}</span>
            </Detail>

            <Detail label="Due date">
              {task.dueDate ? (
                <span style={{ fontSize: 13, color: isOverdue ? 'var(--red)' : 'var(--text)' }}>
                  {format(new Date(task.dueDate), 'dd MMM yyyy')}
                  {isOverdue && ' (Overdue)'}
                </span>
              ) : <span style={{ fontSize: 12, color: 'var(--text3)' }}>No due date</span>}
            </Detail>

            <Detail label="Created">
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{task.createdAt ? format(new Date(task.createdAt), 'dd MMM yyyy') : ''}</span>
            </Detail>

            {task.completedAt && (
              <Detail label="Completed">
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>{format(new Date(task.completedAt), 'dd MMM yyyy')}</span>
              </Detail>
            )}

            {task.tags?.length > 0 && (
              <Detail label="Tags">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {task.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 11, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 4, padding: '2px 6px', color: 'var(--text2)' }}>{tag}</span>
                  ))}
                </div>
              </Detail>
            )}
          </div>

          {isAdmin() && (
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Quick edit</div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Priority</label>
                <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))} style={{ ...inp, padding: '6px 10px', fontSize: 12 }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <button onClick={handleSaveEdit} disabled={saving}
                style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px', fontSize: 12, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

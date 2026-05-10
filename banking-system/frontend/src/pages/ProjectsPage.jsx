import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectAPI, teamAPI } from '../api'
import useAuthStore from '../store/authStore'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { Modal } from '../components/ui/index.jsx'
import { showToast } from '../components/ui/index.jsx'

function ProjectCard({ project, onClick }) {
  const pct = project.taskCount ? Math.round(project.completedCount / project.taskCount * 100) : 0
  return (
    <div onClick={onClick}
      style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: project.color, flexShrink: 0 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>{project.name}</div>
        </div>
        <Badge variant={project.status}>{project.status}</Badge>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>{project.description || 'No description'}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>
        <span>{pct}% complete</span>
        <span>{project.completedCount}/{project.taskCount} tasks</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: project.color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: -4 }}>
          {project.members?.slice(0, 5).map((m, i) => (
            <div key={m._id || i} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 5 - i }}>
              <Avatar name={m.user?.name || ''} size={22} style={{ border: '2px solid var(--bg2)' }} />
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{project.members?.length} member{project.members?.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [form, setForm] = useState({ name: '', description: '', color: '#58a6ff', memberIds: [], deadline: '' })
  const [saving, setSaving] = useState(false)
  const { isAdmin, user } = useAuthStore()
  const navigate = useNavigate()

  const load = () => projectAPI.getAll().then(r => setProjects(r.data.data)).finally(() => setLoading(false))

  useEffect(() => {
    load()
    if (isAdmin()) teamAPI.getAll().then(r => setAllUsers(r.data.data))
  }, [])

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await projectAPI.create(form)
      showToast('Project created!')
      setShowModal(false)
      setForm({ name: '', description: '', color: '#58a6ff', memberIds: [], deadline: '' })
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create project', 'error')
    } finally { setSaving(false) }
  }

  const toggleMember = id => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter(m => m !== id) : [...f.memberIds, id]
    }))
  }

  const inp = { width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }
  const lbl = { display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={36} /></div>

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Projects</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setShowModal(true)}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer' }}>
            + New project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>No projects yet</div>
          <div style={{ fontSize: 13 }}>{isAdmin() ? 'Create your first project to get started.' : 'Ask an admin to create a project and add you.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {projects.map(p => <ProjectCard key={p._id} project={p} onClick={() => navigate(`/projects/${p._id}`)} />)}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New project">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Project name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mobile App v3" style={inp} /></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What is this project about?" style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>Color</label><input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ ...inp, padding: 4, height: 38, cursor: 'pointer' }} /></div>
            <div><label style={lbl}>Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={inp} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Add members</label>
            <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {allUsers.filter(u2 => u2._id !== user?._id).map(u2 => (
                <label key={u2._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: form.memberIds.includes(u2._id) ? 'rgba(63,185,80,.08)' : 'transparent' }}>
                  <input type="checkbox" checked={form.memberIds.includes(u2._id)} onChange={() => toggleMember(u2._id)} />
                  <Avatar name={u2.name} size={24} />
                  <div><div style={{ fontSize: 12, fontWeight: 500 }}>{u2.name}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>{u2.role}</div></div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '7px 14px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#0d1117', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Creating...' : 'Create project'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

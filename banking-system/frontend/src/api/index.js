import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refreshToken')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh })
        localStorage.setItem('accessToken', data.data.accessToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: d => api.post('/auth/register', d),
  login: d => api.post('/auth/login', d),
  getMe: () => api.get('/auth/me'),
  updateMe: d => api.patch('/auth/me', d),
  changePassword: d => api.patch('/auth/change-password', d),
}

export const projectAPI = {
  getAll: () => api.get('/projects'),
  create: d => api.post('/projects', d),
  getOne: id => api.get(`/projects/${id}`),
  update: (id, d) => api.patch(`/projects/${id}`, d),
  remove: id => api.delete(`/projects/${id}`),
  addMember: (id, d) => api.post(`/projects/${id}/members`, d),
  removeMember: (id, uid) => api.delete(`/projects/${id}/members/${uid}`),
  getStats: id => api.get(`/projects/${id}/stats`),
  getLabels: id => api.get(`/projects/${id}/labels`),
  createLabel: (id, d) => api.post(`/projects/${id}/labels`, d),
  deleteLabel: (id, lid) => api.delete(`/projects/${id}/labels/${lid}`),
}

export const taskAPI = {
  getAll: params => api.get('/tasks', { params }),
  create: d => api.post('/tasks', d),
  getOne: id => api.get(`/tasks/${id}`),
  update: (id, d) => api.patch(`/tasks/${id}`, d),
  remove: id => api.delete(`/tasks/${id}`),
  addComment: (id, d) => api.post(`/tasks/${id}/comments`, d),
  deleteComment: (id, cid) => api.delete(`/tasks/${id}/comments/${cid}`),
  getDashboard: () => api.get('/tasks/dashboard'),
}

export const teamAPI = {
  getAll: () => api.get('/team'),
  changeRole: (id, role) => api.patch(`/team/${id}/role`, { role }),
  deactivate: id => api.delete(`/team/${id}`),
}

export const notificationAPI = {
  getAll: params => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: id => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: id => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
}

export const searchAPI = {
  search: q => api.get('/search', { params: { q } }),
}

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
}

export const exportAPI = {
  tasksCSV: (projectId) => {
    const token = localStorage.getItem('accessToken')
    const base = import.meta.env.VITE_API_URL || '/api'
    const url = `${base}/export/tasks.csv${projectId ? `?projectId=${projectId}` : ''}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', 'taskflow-export.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
  },
}

export default api

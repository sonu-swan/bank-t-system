import { create } from 'zustand'
import { authAPI } from '../api'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { set({ loading: false }); return }
    try {
      const { data } = await authAPI.getMe()
      set({ user: data.data, loading: false })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    set({ error: null })
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    set({ user: data.data.user })
  },

  register: async (name, email, password, role) => {
    set({ error: null })
    const { data } = await authAPI.register({ name, email, password, role })
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    set({ user: data.data.user })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null })
  },

  updateUser: user => set({ user }),

  isAdmin: () => get().user?.role === 'admin',
}))

export default useAuthStore

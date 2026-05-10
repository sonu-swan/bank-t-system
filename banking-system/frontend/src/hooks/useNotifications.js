import { useState, useEffect, useCallback } from 'react'
import { notificationAPI } from '../api'
import useAuthStore from '../store/authStore'

export default function useNotifications() {
  const user = useAuthStore(s => s.user)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCount = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationAPI.unreadCount()
      setUnreadCount(data.count)
    } catch {}
  }, [user])

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await notificationAPI.getAll({ limit: 30 })
      setNotifications(data.data)
      setUnreadCount(data.unreadCount)
    } catch {} finally { setLoading(false) }
  }, [user])

  const markRead = async (id) => {
    await notificationAPI.markRead(id)
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const markAllRead = async () => {
    await notificationAPI.markAllRead()
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearAll = async () => {
    await notificationAPI.clearAll()
    setNotifications([])
    setUnreadCount(0)
  }

  // Poll every 30 seconds
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return { unreadCount, notifications, loading, fetchAll, markRead, markAllRead, clearAll }
}

import { useState, useEffect } from 'react'

export default function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tf-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('tf-theme', theme)

    if (theme === 'light') {
      document.documentElement.style.setProperty('--bg', '#f6f8fa')
      document.documentElement.style.setProperty('--bg2', '#ffffff')
      document.documentElement.style.setProperty('--bg3', '#f0f2f5')
      document.documentElement.style.setProperty('--bg4', '#e8eaed')
      document.documentElement.style.setProperty('--border', 'rgba(0,0,0,0.08)')
      document.documentElement.style.setProperty('--border2', 'rgba(0,0,0,0.15)')
      document.documentElement.style.setProperty('--text', '#1a1a2e')
      document.documentElement.style.setProperty('--text2', '#57606a')
      document.documentElement.style.setProperty('--text3', '#8c959f')
    } else {
      document.documentElement.style.setProperty('--bg', '#0d1117')
      document.documentElement.style.setProperty('--bg2', '#161b22')
      document.documentElement.style.setProperty('--bg3', '#1c2330')
      document.documentElement.style.setProperty('--bg4', '#21262d')
      document.documentElement.style.setProperty('--border', 'rgba(255,255,255,0.08)')
      document.documentElement.style.setProperty('--border2', 'rgba(255,255,255,0.14)')
      document.documentElement.style.setProperty('--text', '#e6edf3')
      document.documentElement.style.setProperty('--text2', '#8b949e')
      document.documentElement.style.setProperty('--text3', '#6e7681')
    }
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggle }
}

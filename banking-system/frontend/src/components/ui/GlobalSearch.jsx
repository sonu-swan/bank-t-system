import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAPI } from '../../api'
import Badge from './Badge.jsx'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const { data } = await searchAPI.search(q)
      setResults(data.data)
    } catch {} finally { setLoading(false) }
  }, [])

  const handleChange = e => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 350)
  }

  const handleFocus = () => setOpen(true)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    const shortcut = e => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); setOpen(true) } }
    document.addEventListener('keydown', shortcut)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', shortcut) }
  }, [])

  const go = (path) => {
    navigate(path)
    setOpen(false)
    setQuery('')
    setResults(null)
  }

  const hasResults = results && (results.tasks?.length > 0 || results.projects?.length > 0)

  return (
    <div ref={ref} style={{ position: 'relative', width: 240 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Search… ⌘K"
          style={{
            width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            borderRadius: 8, padding: '6px 12px 6px 32px', fontSize: 13,
            color: 'var(--text)', outline: 'none',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null) }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}>✕</button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 38, left: 0, right: 0,
          background: 'var(--bg2)', border: '0.5px solid var(--border2)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 300, overflow: 'hidden', minWidth: 320,
        }}>
          {loading ? (
            <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>Searching...</div>
          ) : !hasResults ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>No results for "{query}"</div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {results.tasks?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tasks</div>
                  {results.tasks.map(t => (
                    <div key={t._id} onClick={() => go(`/tasks/${t._id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: { todo: '#8b949e', 'in-progress': '#58a6ff', 'in-review': '#bc8cff', done: '#3fb950' }[t.status] || '#888', flexShrink: 0 }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                        {t.project && <div style={{ fontSize: 10, color: t.project.color, marginTop: 1 }}>{t.project.name}</div>}
                      </div>
                      <Badge variant={t.priority}>{t.priority}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {results.projects?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '0.5px solid var(--border)' }}>Projects</div>
                  {results.projects.map(p => (
                    <div key={p._id} onClick={() => go(`/projects/${p._id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text2)' }}>{p.members?.length} members</div>
                      </div>
                      <Badge variant={p.status}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import React from 'react'

export default function Button({ variant = 'default', children, loading, disabled, style = {}, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 'var(--radius)',
    fontSize: 13, fontWeight: 500, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1, transition: 'all 0.15s',
    border: 'none', fontFamily: 'var(--font)',
  }

  const variants = {
    default: { background: 'none', border: '0.5px solid var(--border2)', color: 'var(--text)' },
    primary: { background: 'var(--accent)', color: '#0d1117' },
    danger: { background: 'none', border: '0.5px solid var(--red)', color: 'var(--red)' },
    ghost: { background: 'none', border: 'none', color: 'var(--text2)' },
    blue: { background: 'none', border: '0.5px solid var(--blue)', color: 'var(--blue)' },
  }

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span>Loading...</span> : children}
    </button>
  )
}

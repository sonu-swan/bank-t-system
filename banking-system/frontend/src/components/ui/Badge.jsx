// Badge.jsx
import React from 'react'

const variants = {
  todo: { bg: 'rgba(125,133,144,.15)', color: '#8b949e' },
  'in-progress': { bg: 'rgba(88,166,255,.12)', color: '#58a6ff' },
  'in-review': { bg: 'rgba(188,140,255,.12)', color: '#bc8cff' },
  done: { bg: 'rgba(63,185,80,.12)', color: '#3fb950' },
  low: { bg: 'rgba(63,185,80,.1)', color: '#3fb950' },
  medium: { bg: 'rgba(227,179,65,.1)', color: '#e3b341' },
  high: { bg: 'rgba(248,81,73,.1)', color: '#f85149' },
  urgent: { bg: 'rgba(255,107,53,.1)', color: '#ff6b35' },
  overdue: { bg: 'rgba(248,81,73,.12)', color: '#f85149' },
  admin: { bg: 'rgba(188,140,255,.12)', color: '#bc8cff' },
  member: { bg: 'rgba(88,166,255,.12)', color: '#58a6ff' },
  active: { bg: 'rgba(63,185,80,.12)', color: '#3fb950' },
  'on-hold': { bg: 'rgba(227,179,65,.12)', color: '#e3b341' },
  completed: { bg: 'rgba(88,166,255,.12)', color: '#58a6ff' },
  archived: { bg: 'rgba(125,133,144,.15)', color: '#8b949e' },
}

export default function Badge({ variant = 'todo', children, style = {} }) {
  const v = variants[variant] || variants.todo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
      background: v.bg, color: v.color, ...style,
    }}>
      {children}
    </span>
  )
}

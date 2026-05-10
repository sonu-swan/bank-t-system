// Avatar.jsx
import React from 'react'

const COLORS = ['#3fb950','#58a6ff','#bc8cff','#ffa657','#e3b341','#f85149','#79c0ff','#d2a8ff']

function getColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Avatar({ name = '', size = 32, style = {} }) {
  const bg = getColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: '#0d1117',
      flexShrink: 0, userSelect: 'none', ...style,
    }}>
      {getInitials(name)}
    </div>
  )
}

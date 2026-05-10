import React from 'react'

export default function LoadingSpinner({ size = 24 }) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid var(--border2)`, borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </>
  )
}

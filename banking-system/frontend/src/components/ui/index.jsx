import React, { useEffect, useRef } from 'react'

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open) return null

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border2)',
        borderRadius: 14, padding: 24, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow)',
      }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
        )}
        {children}
        {footer && <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>{footer}</div>}
      </div>
    </div>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────────
export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{label}</label>}
      <input
        style={{
          width: '100%', background: 'var(--bg3)', border: `0.5px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
          borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 14, color: 'var(--text)',
          outline: 'none', transition: 'border-color 0.15s', ...style,
        }}
        {...props}
      />
      {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

// ── Select ─────────────────────────────────────────────────────────────────────
export function Select({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{label}</label>}
      <select
        style={{
          width: '100%', background: 'var(--bg3)', border: `0.5px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
          borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 14, color: 'var(--text)',
          outline: 'none', appearance: 'none', cursor: 'pointer', ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────────
export function Textarea({ label, error, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{label}</label>}
      <textarea
        style={{
          width: '100%', background: 'var(--bg3)', border: `0.5px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
          borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 14, color: 'var(--text)',
          outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'var(--font)', ...style,
        }}
        {...props}
      />
      {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

// ── LoadingSpinner ─────────────────────────────────────────────────────────────
export default function LoadingSpinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--border2)`, borderTopColor: 'var(--accent)',
      animation: 'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'border-color 0.15s' : 'none',
        ...style,
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'var(--border2)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {children}
    </div>
  )
}

// ── Page header ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: subtitle ? 4 : 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text2)' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text2)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ fontSize: 13, marginBottom: 16 }}>{description}</p>}
      {action}
    </div>
  )
}

// ── Toast (global) ─────────────────────────────────────────────────────────────
let toastTimeout = null
export function showToast(message, type = 'success') {
  let el = document.getElementById('global-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'global-toast'
    document.body.appendChild(el)
  }
  el.textContent = message
  el.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: ${type === 'error' ? 'rgba(248,81,73,.15)' : 'rgba(31,35,40,.95)'};
    border: 0.5px solid ${type === 'error' ? 'rgba(248,81,73,.4)' : 'rgba(88,166,255,.3)'};
    color: ${type === 'error' ? '#f85149' : '#e6edf3'};
    padding: 10px 20px; border-radius: 30px; font-size: 13px; font-family: var(--font);
    z-index: 9999; opacity: 1; transition: opacity 0.3s; white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  `
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => { if (el) el.style.opacity = '0'; }, 2500)
}

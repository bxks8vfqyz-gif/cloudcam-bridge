import { useState, useEffect, useCallback } from 'react'

const get   = p    => fetch('/api'+p).then(r=>r.json())
const post  = (p,b)=> fetch('/api'+p,{method:'POST',  headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json())
const del   = p    => fetch('/api'+p,{method:'DELETE'}).then(r=>r.json())
const patch = (p,b)=> fetch('/api'+p,{method:'PATCH', headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json())

/* ── Icons (SF Symbols–inspired, inline SVG) ─────────────────────── */

const Icon = ({ children, size = 20, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
)

const VideoIcon = (p) => <Icon {...p}><path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="7" width="12" height="10" rx="2"/></Icon>
const PlusIcon = (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>
const TrashIcon = (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/></Icon>
const WifiIcon = (p) => <Icon {...p}><path d="M5 12.55a11 11 0 0114 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="0.5" fill={p.color||'currentColor'} stroke="none"/></Icon>
const CopyIcon = (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Icon>
const CheckIcon = (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>
const XIcon = (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>
const EditIcon = (p) => <Icon {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>
const CameraIcon = (p) => <Icon {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Icon>
const ShieldIcon = (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>
const ArrowIcon = (p) => <Icon {...p}><polyline points="9 18 15 12 9 6"/></Icon>

/* ── Shared Styles ────────────────────────────────────────────────── */

const styles = {
  /* Buttons */
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 20px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-xl)', cursor: 'pointer',
    fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
    transition: 'all 0.2s ease',
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 20px', background: 'var(--fill)', color: 'var(--accent)',
    border: 'none', borderRadius: 'var(--radius-xl)', cursor: 'pointer',
    fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
    transition: 'all 0.2s ease',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 8, background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-tertiary)', borderRadius: 'var(--radius-sm)',
    transition: 'all 0.15s ease',
  },
  /* Cards */
  card: {
    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  /* Inputs */
  input: {
    width: '100%', padding: '11px 14px',
    background: 'var(--fill-secondary)', border: 'none',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: 16, outline: 'none', transition: 'box-shadow 0.2s ease',
  },
  /* Modal overlay */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, padding: 20,
    animation: 'overlayIn 0.2s ease',
  },
  modal: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)', padding: 0,
    width: '100%', maxWidth: 440,
    boxShadow: 'var(--shadow-lg)',
    animation: 'scaleIn 0.25s ease',
    overflow: 'hidden',
  },
}

/* ── Copy Button ──────────────────────────────────────────────────── */

function CopyBtn({ value }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800) }}
      style={{
        ...styles.btnGhost,
        color: done ? 'var(--green)' : 'var(--text-tertiary)',
        padding: 6,
      }}
    >
      {done ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
    </button>
  )
}

/* ── ONVIF Detail Panel ───────────────────────────────────────────── */

function ONVIFPanel({ info, onClose }) {
  if (!info) return null
  const rows = [
    { label: 'IP Address', value: info.host },
    { label: 'ONVIF Port', value: String(info.port) },
    { label: 'Username', value: info.username },
    { label: 'Password', value: info.password },
  ]
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              UniFi Protect Setup
            </h3>
            <button onClick={onClose} style={styles.btnGhost}><XIcon size={18} /></button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: 16 }}>
            Enter these details when adding a third-party ONVIF camera in Protect.
          </p>
        </div>

        {/* Info rows */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ ...styles.card, overflow: 'hidden' }}>
            {rows.map((r, i) => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < rows.length - 1 ? '1px solid var(--separator)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, fontFamily: 'SF Mono, SFMono-Regular, Menlo, monospace', color: 'var(--text-primary)' }}>{r.value}</div>
                </div>
                <CopyBtn value={r.value} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px 24px' }}>
          <button onClick={onClose} style={{ ...styles.btnPrimary, width: '100%', padding: '14px 20px', fontSize: 17, borderRadius: 'var(--radius-md)' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Form Input (defined outside to prevent re-mount on each render) ── */

function FormField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
      <textarea
        value={value} onChange={onChange} placeholder={placeholder}
        rows={1}
        style={{
          ...styles.input,
          resize: 'none', overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          lineHeight: '1.4',
        }}
        onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.25)'}
        onBlur={e => e.target.style.boxShadow = 'none'}
        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
      />
    </div>
  )
}

/* ── Camera Add/Edit Modal ────────────────────────────────────────── */

function CameraModal({ existing, onSave, onClose }) {
  const [form, setForm] = useState(existing
    ? { name: existing.name, rtsp_url: existing.rtsp_url, width: String(existing.width), height: String(existing.height), framerate: String(existing.framerate) }
    : { name: '', rtsp_url: '', width: '1920', height: '1080', framerate: '15' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Camera name is required')
    if (!form.rtsp_url.trim()) return setError('RTSP URL is required')
    if (!form.rtsp_url.startsWith('rtsp://')) return setError('URL must start with rtsp://')
    setSaving(true); setError('')
    const body = { name: form.name.trim(), rtsp_url: form.rtsp_url.trim(), width: parseInt(form.width) || 1920, height: parseInt(form.height) || 1080, framerate: parseInt(form.framerate) || 15 }
    const res = existing ? await patch(`/cameras/${existing.id}`, body) : await post('/cameras', body)
    setSaving(false)
    if (res.camera) { onSave(res.camera, res.onvif); onClose() }
    else setError(res.detail || 'Failed to save camera')
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {existing ? 'Edit Camera' : 'New Camera'}
            </h3>
            <button onClick={onClose} style={styles.btnGhost}><XIcon size={18} /></button>
          </div>
        </div>

        {/* Form */}
        <form autoComplete="off" onSubmit={e => { e.preventDefault(); handleSave() }} style={{ padding: '0 24px' }}>
          {/* Hidden honeypot fields to trick Safari autofill */}
          <input type="text" name="fakeusernameremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, padding: 0, border: 'none' }} tabIndex={-1} />
          <input type="password" name="fakepasswordremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, padding: 0, border: 'none' }} tabIndex={-1} />
          <FormField label="Name" value={form.name} onChange={f('name')} placeholder="e.g. Front Door" />
          <FormField label="RTSP URL" value={form.rtsp_url} onChange={f('rtsp_url')} placeholder="rtsp://192.168.1.x:8554/camera-name" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[['Width', 'width', '1920'], ['Height', 'height', '1080'], ['FPS', 'framerate', '15']].map(([label, key, ph]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
                <input type="number" value={form[key]} onChange={f(key)} placeholder={ph}
                  autoComplete="off"
                  style={styles.input}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.25)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
              </div>
            ))}
          </div>

          {/* Hint */}
          <div style={{
            padding: '10px 14px', background: 'var(--fill-secondary)',
            borderRadius: 'var(--radius-sm)', marginBottom: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Open Scrypted, select your camera, then copy the URL from the RTSP tab.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(255,59,48,0.1)',
              borderRadius: 'var(--radius-sm)', marginTop: 8,
            }}>
              <p style={{ fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...styles.btnSecondary, flex: 1, borderRadius: 'var(--radius-md)', padding: '14px 20px', fontSize: 17 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            ...styles.btnPrimary, flex: 2, borderRadius: 'var(--radius-md)', padding: '14px 20px', fontSize: 17,
            opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving...' : (existing ? 'Save' : 'Add Camera')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Camera Card ──────────────────────────────────────────────────── */

function CameraCard({ camera, onDelete, onEdit, onONVIF }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      transition: 'background 0.15s ease',
    }}>
      {/* Icon */}
      <div style={{
        width: 44, height: 44,
        background: 'rgba(0,122,255,0.1)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <VideoIcon size={22} color="var(--accent)" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.01em' }}>
          {camera.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {camera.width}x{camera.height} · {camera.framerate} fps · Port {camera.onvif_port}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
        <button onClick={() => onONVIF(camera.id)} style={{
          ...styles.btnSecondary,
          padding: '6px 14px', fontSize: 13, fontWeight: 600,
          borderRadius: 'var(--radius-xl)', gap: 5,
        }}>
          <WifiIcon size={14} color="var(--accent)" /> ONVIF
        </button>
        <button onClick={() => onEdit(camera)} style={{ ...styles.btnGhost, padding: 8 }}>
          <EditIcon size={17} color="var(--text-quaternary)" />
        </button>
        <button onClick={() => onDelete(camera.id)} style={{ ...styles.btnGhost, padding: 8 }}>
          <TrashIcon size={17} color="var(--red)" />
        </button>
      </div>
    </div>
  )
}

/* ── Stat Card ────────────────────────────────────────────────────── */

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{
      ...styles.card, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        width: 36, height: 36,
        background: `${color}16`, borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

/* ── Main App ─────────────────────────────────────────────────────── */

export default function App() {
  const [cameras, setCameras] = useState([])
  const [status, setStatus] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [onvifInfo, setOnvifInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [camRes, statRes] = await Promise.all([get('/cameras'), get('/status')])
    setCameras(camRes?.cameras || []); setStatus(statRes); setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDelete = async id => {
    if (!confirm('Remove this camera?')) return
    await del(`/cameras/${id}`); refresh()
  }
  const handleSave = (camera, onvif) => { refresh(); if (onvif && !editing) setOnvifInfo(onvif) }
  const handleONVIF = async id => { const res = await get(`/cameras/${id}/onvif`); setOnvifInfo(res) }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ── Navigation Bar ── */}
      <nav style={{
        background: 'var(--system-bg-material)',
        backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--separator)',
        padding: '12px 20px',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #007aff, #5856d6)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,122,255,0.25)',
            }}>
              <CameraIcon size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                CloudCam Bridge
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '-0.01em' }}>
                RTSP to ONVIF for UniFi Protect
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {status && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                background: 'rgba(52,199,89,0.12)',
                borderRadius: 'var(--radius-xl)',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px rgba(52,199,89,0.5)' }} />
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Active</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          marginBottom: 28,
          animation: 'fadeIn 0.4s ease',
        }}>
          <StatCard icon={<VideoIcon size={18} color="var(--accent)" />} value={cameras.length} label="Cameras" color="var(--accent)" />
          <StatCard icon={<WifiIcon size={18} color="var(--indigo)" />} value={cameras.length} label="ONVIF Servers" color="var(--indigo)" />
          <StatCard icon={<CameraIcon size={18} color="var(--teal)" />} value={status?.go2rtc_streams ?? 0} label="Active Streams" color="var(--teal)" />
        </div>

        {/* Camera list header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Cameras
          </h2>
          <button onClick={() => setShowAdd(true)} style={{
            ...styles.btnPrimary, padding: '8px 16px', fontSize: 14, borderRadius: 'var(--radius-xl)',
          }}>
            <PlusIcon size={16} color="white" /> Add Camera
          </button>
        </div>

        {/* Camera list */}
        {loading ? (
          <div style={{ ...styles.card, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: 'var(--text-tertiary)', animation: 'pulse 1.5s infinite' }}>Loading...</div>
          </div>
        ) : cameras.length === 0 ? (
          <div style={{
            ...styles.card, padding: '48px 32px', textAlign: 'center',
            animation: 'fadeIn 0.5s ease',
          }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 16px',
              background: 'var(--fill-secondary)', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VideoIcon size={28} color="var(--text-quaternary)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
              No Cameras Yet
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5, maxWidth: 320, margin: '0 auto 20px' }}>
              Add an RTSP stream from Scrypted and it will appear here as an ONVIF camera for UniFi Protect.
            </p>
            <button onClick={() => setShowAdd(true)} style={{
              ...styles.btnPrimary, padding: '12px 24px', fontSize: 16, borderRadius: 'var(--radius-xl)',
            }}>
              <PlusIcon size={18} color="white" /> Add Your First Camera
            </button>
          </div>
        ) : (
          <div style={{
            ...styles.card, overflow: 'hidden',
            animation: 'fadeIn 0.4s ease',
          }}>
            {cameras.map((cam, i) => (
              <div key={cam.id}>
                <CameraCard camera={cam} onDelete={handleDelete} onEdit={c => setEditing(c)} onONVIF={handleONVIF} />
                {i < cameras.length - 1 && <div style={{ height: 1, background: 'var(--separator)', marginLeft: 74 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Quick start guide */}
        {cameras.length > 0 && (
          <div style={{
            ...styles.card, marginTop: 20, padding: '16px 18px',
            animation: 'fadeIn 0.5s ease 0.1s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(88,86,214,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <WifiIcon size={15} color="var(--indigo)" />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Connect to UniFi Protect
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 38 }}>
              {[
                'Tap ONVIF on a camera to see its connection details',
                'In Protect: Settings \u2192 Cameras \u2192 Add Camera \u2192 Third-Party ONVIF',
                'Enter the IP, port, username, and password',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                    width: 20, height: 20, borderRadius: 10,
                    background: 'rgba(0,122,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</span>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy notice */}
        <div style={{
          marginTop: 16, padding: '14px 18px',
          ...styles.card,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'fadeIn 0.5s ease 0.2s both',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(52,199,89,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldIcon size={17} color="var(--green)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Fully local.</strong> All streams stay on your network. No cloud, no external connections.
          </p>
        </div>
      </div>

      {/* ── Modals ── */}
      {showAdd && <CameraModal onSave={handleSave} onClose={() => setShowAdd(false)} />}
      {editing && <CameraModal existing={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      {onvifInfo && <ONVIFPanel info={onvifInfo} onClose={() => setOnvifInfo(null)} />}
    </div>
  )
}

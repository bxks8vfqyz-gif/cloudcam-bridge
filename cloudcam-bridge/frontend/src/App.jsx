import { useState, useEffect, useCallback } from 'react'

const get   = p    => fetch('api'+p).then(r=>r.json())
const post  = (p,b)=> fetch('api'+p,{method:'POST',  headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json())
const del   = p    => fetch('api'+p,{method:'DELETE'}).then(r=>r.json())
const patch = (p,b)=> fetch('api'+p,{method:'PATCH', headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json())

/* ── Icons ────────────────────────────────────────────────────────── */

const I = ({ d, size = 20, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)

const VideoIcon = (p) => <I {...p} d={<><path d="M15.6 11.4L20 9v6l-4.4-2.4z"/><rect x="3" y="7" width="13" height="10" rx="1.5"/></>} />
const PlusIcon = (p) => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const TrashIcon = (p) => <I {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>} />
const WifiIcon = (p) => <I {...p} d={<><path d="M2 10c6-6.67 14-6.67 20 0"/><path d="M6 14c3.6-4 8.4-4 12 0"/><circle cx="12" cy="18" r="1" fill={p.color||'currentColor'} stroke="none"/></>} />
const CopyIcon = (p) => <I {...p} d={<><rect x="9" y="9" width="13" height="13" rx="1.5"/><path d="M5 15H4a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 014 3h9A1.5 1.5 0 0114.5 4.5V5"/></>} />
const CheckIcon = (p) => <I {...p} d={<polyline points="20 6 9 17 4 12"/>} />
const XIcon = (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />
const EditIcon = (p) => <I {...p} d={<><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></>} />
const ShieldIcon = (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} />
const StreamIcon = (p) => <I {...p} d={<><path d="M2 8l2 2-2 2"/><path d="M22 8l-2 2 2 2"/><line x1="9" y1="20" x2="15" y2="4"/></>} />
const ServerIcon = (p) => <I {...p} d={<><rect x="2" y="2" width="20" height="8" rx="1.5"/><rect x="2" y="14" width="20" height="8" rx="1.5"/><circle cx="6" cy="6" r="1" fill={p.color||'currentColor'} stroke="none"/><circle cx="6" cy="18" r="1" fill={p.color||'currentColor'} stroke="none"/></>} />
const SearchIcon = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const DownloadIcon = (p) => <I {...p} d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />

/* ── Copy Button ──────────────────────────────────────────────────── */

function CopyBtn({ value }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800) }}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 4,
        color: done ? 'var(--green)' : 'var(--text-tertiary)',
        transition: 'color 0.15s',
      }}
    >
      {done ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
    </button>
  )
}

/* ── ONVIF Panel ──────────────────────────────────────────────────── */

function ONVIFPanel({ info, onClose }) {
  if (!info) return null
  const rows = [
    { label: 'IP Address', value: info.host },
    { label: 'ONVIF Port', value: String(info.port) },
    { label: 'Username', value: info.username },
    { label: 'Password', value: info.password },
  ]
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 20, animation: 'overlayIn 0.15s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 420,
        boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <WifiIcon size={16} color="var(--accent-text)" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>ONVIF Connection</h3>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Add as Third-Party Camera in Protect</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Rows */}
        <div style={{ padding: '4px 0' }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 20px',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.value}</div>
              </div>
              <CopyBtn value={r.value} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 20px' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '10px 16px', background: 'var(--accent)',
            color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'background 0.15s',
          }}>Done</button>
        </div>
      </div>
    </div>
  )
}

/* ── Form Field ───────────────────────────────────────────────────── */

function FormField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
      <textarea
        value={value} onChange={onChange} placeholder={placeholder}
        rows={1}
        style={{
          width: '100%', padding: '9px 12px',
          background: 'var(--bg-input)', border: '1px solid var(--border-input)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
          fontSize: 13, outline: 'none', resize: 'none', overflow: 'hidden',
          fontFamily: 'var(--font)', lineHeight: '1.4',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
      />
    </div>
  )
}

/* ── Camera Modal ─────────────────────────────────────────────────── */

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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 20, animation: 'overlayIn 0.15s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440,
        boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {existing ? 'Edit Camera' : 'Add Camera'}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form autoComplete="off" onSubmit={e => { e.preventDefault(); handleSave() }} style={{ padding: '16px 20px 0' }}>
          <input type="text" name="fakeuser" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, padding: 0, border: 'none' }} tabIndex={-1} />
          <input type="password" name="fakepass" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, padding: 0, border: 'none' }} tabIndex={-1} />

          <FormField label="Camera Name" value={form.name} onChange={f('name')} placeholder="e.g. Front Door" />
          <FormField label="RTSP URL" value={form.rtsp_url} onChange={f('rtsp_url')} placeholder="rtsp://192.168.1.x:8554/camera-name" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[['Width', 'width', '1920'], ['Height', 'height', '1080'], ['FPS', 'framerate', '15']].map(([label, key, ph]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                <input type="number" value={form[key]} onChange={f(key)} placeholder={ph}
                  autoComplete="off"
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            ))}
          </div>

          <div style={{
            padding: '8px 12px', background: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-sm)', marginBottom: 6,
            borderLeft: '3px solid var(--accent)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--accent-text)', lineHeight: 1.5 }}>
              In Scrypted, open your camera and copy the URL from the RTSP tab.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '8px 12px', background: 'var(--red-subtle)',
              borderRadius: 'var(--radius-sm)', marginTop: 8,
              borderLeft: '3px solid var(--red)',
            }}>
              <p style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 500 }}>{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 16px', background: 'transparent',
            border: '1px solid var(--border-input)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '10px 16px', background: saving ? 'var(--accent-hover)' : 'var(--accent)',
            color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13,
            opacity: saving ? 0.7 : 1, transition: 'all 0.15s',
          }}>
            {saving ? 'Saving...' : (existing ? 'Save Changes' : 'Add Camera')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Camera Row ───────────────────────────────────────────────────── */

function CameraRow({ camera, onDelete, onEdit, onONVIF, isLast }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: hover ? 'var(--bg-card-hover)' : 'transparent',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
    >
      {/* Status dot + icon */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <VideoIcon size={17} color="var(--accent-text)" />
        </div>
        <div style={{
          position: 'absolute', bottom: -1, right: -1, width: 10, height: 10,
          borderRadius: '50%', background: 'var(--green)',
          border: '2px solid var(--bg-card)',
        }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
          {camera.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{camera.width}x{camera.height}</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span>{camera.framerate} fps</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span>Port {camera.onvif_port}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, opacity: hover ? 1 : 0.4, transition: 'opacity 0.15s' }}>
        <button onClick={() => onONVIF(camera.id)} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', background: 'var(--accent-subtle)',
          border: '1px solid rgba(0,111,255,0.2)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', color: 'var(--accent-text)', fontSize: 11, fontWeight: 600,
        }}>
          <WifiIcon size={12} color="var(--accent-text)" /> ONVIF
        </button>
        <button onClick={() => onEdit(camera)} style={{
          padding: '5px 7px', background: 'transparent',
          border: '1px solid var(--border-input)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', color: 'var(--text-tertiary)',
        }}>
          <EditIcon size={13} />
        </button>
        <button onClick={() => onDelete(camera.id)} style={{
          padding: '5px 7px', background: 'transparent',
          border: '1px solid rgba(244,67,54,0.2)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', color: 'var(--red)',
        }}>
          <TrashIcon size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── Scrypted Discovery ──────────────────────────────────────────── */

function ScryptedDiscovery({ onAdd, existingCameras }) {
  const [discovered, setDiscovered] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [configured, setConfigured] = useState(false)
  const [adding, setAdding] = useState({})

  useEffect(() => {
    get('/scrypted/status').then(r => setConfigured(r?.configured || false)).catch(() => {})
  }, [])

  const handleDiscover = async () => {
    setLoading(true); setError(''); setDiscovered([])
    const res = await get('/discover/scrypted')
    setLoading(false)
    if (res.error) setError(res.error)
    if (res.cameras) setDiscovered(res.cameras)
  }

  const handleAdd = async (cam) => {
    if (!cam.rtsp_url) return setError(`No RTSP URL found for "${cam.name}". Add it manually with the RTSP URL from Scrypted.`)
    setAdding(p => ({ ...p, [cam.id]: true }))
    const body = { name: cam.name, rtsp_url: cam.rtsp_url, width: cam.width || 1920, height: cam.height || 1080, framerate: cam.framerate || 15 }
    const res = await post('/cameras', body)
    setAdding(p => ({ ...p, [cam.id]: false }))
    if (res.camera) {
      setDiscovered(prev => prev.map(c => c.id === cam.id ? { ...c, already_added: true } : c))
      onAdd(res.camera, res.onvif)
    } else {
      setError(res.detail || 'Failed to add camera')
    }
  }

  if (!configured) return null

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
      marginBottom: 16, animation: 'fadeIn 0.3s ease 0.02s both',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: discovered.length > 0 ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(167,139,250,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SearchIcon size={14} color="#a78bfa" />
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Scrypted Cameras</h3>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Auto-discover cameras from your Scrypted server</p>
          </div>
        </div>
        <button onClick={handleDiscover} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', background: loading ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.12)',
          color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600, fontSize: 12, transition: 'all 0.15s',
        }}>
          <SearchIcon size={13} color="#a78bfa" />
          {loading ? 'Scanning...' : 'Discover'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            padding: '8px 12px', background: 'var(--red-subtle)',
            borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--red)',
          }}>
            <p style={{ fontSize: 12, color: '#ff6b6b' }}>{error}</p>
          </div>
        </div>
      )}

      {discovered.map((cam, i) => (
        <div key={cam.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          borderBottom: i < discovered.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: cam.already_added ? 'var(--green-subtle)' : 'rgba(167,139,250,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <VideoIcon size={15} color={cam.already_added ? 'var(--green)' : '#a78bfa'} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cam.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', gap: 6 }}>
              <span>{cam.type}</span>
              {cam.rtsp_url && <>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--green)' }}>RTSP available</span>
              </>}
              {!cam.rtsp_url && <>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text-muted)' }}>No RTSP URL</span>
              </>}
            </div>
          </div>

          {cam.already_added ? (
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--green)',
              padding: '4px 10px', background: 'var(--green-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <CheckIcon size={12} /> Added
            </span>
          ) : (
            <button onClick={() => handleAdd(cam)} disabled={adding[cam.id]} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', background: 'var(--accent)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: adding[cam.id] ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 11, opacity: adding[cam.id] ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}>
              <PlusIcon size={12} color="white" />
              {adding[cam.id] ? 'Adding...' : 'Add'}
            </button>
          )}
        </div>
      ))}
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

  const handleDelete = async id => { if (!confirm('Remove this camera?')) return; await del(`/cameras/${id}`); refresh() }
  const handleSave = (camera, onvif) => { refresh(); if (onvif && !editing) setOnvifInfo(onvif) }
  const handleONVIF = async id => { const res = await get(`/cameras/${id}/onvif`); setOnvifInfo(res) }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--bg-header)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="var(--accent)"/>
            <path d="M8 11.5L18 11.5C18.8 11.5 19.5 12.2 19.5 13V17C19.5 17.8 18.8 18.5 18 18.5H8C7.2 18.5 6.5 17.8 6.5 17V13C6.5 12.2 7.2 11.5 8 11.5Z" stroke="white" strokeWidth="1.3"/>
            <path d="M19.5 13.5L22 12V18L19.5 16.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              CloudCam Bridge
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px rgba(0,200,83,0.4)' }} />
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>Connected</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          marginBottom: 24, animation: 'fadeIn 0.3s ease',
        }}>
          {[
            { icon: <VideoIcon size={18} color="var(--accent-text)" />, value: cameras.length, label: 'Cameras', bg: 'var(--accent-subtle)' },
            { icon: <ServerIcon size={18} color="#a78bfa" />, value: cameras.length, label: 'ONVIF Servers', bg: 'rgba(167,139,250,0.12)' },
            { icon: <StreamIcon size={18} color="#34d399" />, value: status?.go2rtc_streams ?? 0, label: 'Active Streams', bg: 'var(--green-subtle)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
              }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scrypted Discovery */}
        <ScryptedDiscovery onAdd={handleSave} existingCameras={cameras} />

        {/* Camera list section */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          animation: 'fadeIn 0.3s ease 0.05s both',
        }}>
          {/* List header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Cameras</h2>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                background: 'var(--bg-main)', padding: '1px 7px', borderRadius: 10,
              }}>{cameras.length}</span>
            </div>
            <button onClick={() => setShowAdd(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', background: 'var(--accent)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontWeight: 600, fontSize: 12,
              transition: 'background 0.15s',
            }}>
              <PlusIcon size={14} color="white" /> Add Camera
            </button>
          </div>

          {/* List body */}
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Loading...
            </div>
          ) : cameras.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, margin: '0 auto 14px',
                background: 'var(--bg-main)', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <VideoIcon size={22} color="var(--text-muted)" />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                No cameras configured
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 280, margin: '0 auto 16px', lineHeight: 1.5 }}>
                Add an RTSP stream from Scrypted to create a virtual ONVIF camera for UniFi Protect.
              </p>
              <button onClick={() => setShowAdd(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', background: 'var(--accent)',
                color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontWeight: 600, fontSize: 12,
              }}>
                <PlusIcon size={14} color="white" /> Add Camera
              </button>
            </div>
          ) : (
            cameras.map((cam, i) => (
              <CameraRow key={cam.id} camera={cam} isLast={i === cameras.length - 1}
                onDelete={handleDelete} onEdit={c => setEditing(c)} onONVIF={handleONVIF} />
            ))
          )}
        </div>

        {/* Quick start */}
        {cameras.length > 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: 16, marginTop: 16,
            animation: 'fadeIn 0.3s ease 0.1s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <WifiIcon size={14} color="var(--accent-text)" />
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Connect to Protect
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 22 }}>
              {[
                'Click ONVIF on a camera to view connection details',
                'In Protect: Settings \u2192 Cameras \u2192 Add Camera \u2192 Third-Party ONVIF',
                'Enter the IP, port, username, and password shown',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-text)', fontFamily: 'var(--font-mono)' }}>{i + 1}.</span>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', marginTop: 16,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          animation: 'fadeIn 0.3s ease 0.15s both',
        }}>
          <ShieldIcon size={16} color="var(--green)" />
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>100% Local</strong> — All streams stay on your network. No cloud, no external connections.
          </p>
        </div>
      </div>

      {/* Modals */}
      {showAdd && <CameraModal onSave={handleSave} onClose={() => setShowAdd(false)} />}
      {editing && <CameraModal existing={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      {onvifInfo && <ONVIFPanel info={onvifInfo} onClose={() => setOnvifInfo(null)} />}
    </div>
  )
}

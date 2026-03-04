import { useState, useEffect, useCallback } from 'react'
import { Camera, Plus, Trash2, Wifi, Copy, CheckCircle, Video, RefreshCw, X, Edit2 } from 'lucide-react'

const get   = p    => fetch('/api'+p).then(r=>r.json())
const post  = (p,b)=> fetch('/api'+p,{method:'POST',  headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json())
const del   = p    => fetch('/api'+p,{method:'DELETE'}).then(r=>r.json())
const patch = (p,b)=> fetch('/api'+p,{method:'PATCH', headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json())

function CopyBtn({value}) {
  const [done,setDone] = useState(false)
  return <button onClick={()=>{navigator.clipboard.writeText(value);setDone(true);setTimeout(()=>setDone(false),1800)}} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 5px',color:done?'#34d399':'#475569'}}>{done?<CheckCircle size={13}/>:<Copy size={13}/>}</button>
}

function ONVIFPanel({info,onClose}) {
  if(!info) return null
  const rows=[{label:'IP Address',value:info.host},{label:'ONVIF Port',value:String(info.port)},{label:'Username',value:info.username},{label:'Password',value:info.password}]
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:16}}>
      <div style={{background:'#1e293b',border:'1px solid #334155',borderRadius:14,padding:24,width:'100%',maxWidth:420}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h3 style={{fontSize:17,fontWeight:700,color:'#f1f5f9'}}>Add to UniFi Protect</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b'}}><X size={18}/></button>
        </div>
        <div style={{background:'#0c1a2e',border:'1px solid #1e3a5f',borderRadius:8,padding:'9px 13px',marginBottom:14}}>
          <p style={{fontSize:12,color:'#60a5fa'}}>Settings → Cameras → Add Camera → <strong>Third-Party ONVIF Camera</strong></p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {rows.map(r=>(
            <div key={r.label} style={{background:'#0f172a',borderRadius:8,padding:'9px 13px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontSize:10,color:'#475569',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>{r.label}</div><div style={{fontSize:14,color:'#e2e8f0',fontFamily:'monospace'}}>{r.value}</div></div>
              <CopyBtn value={r.value}/>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{marginTop:16,width:'100%',padding:10,background:'#3b82f6',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:14}}>Done</button>
      </div>
    </div>
  )
}

function CameraModal({existing,onSave,onClose}) {
  const [form,setForm] = useState(existing
    ? {name:existing.name,rtsp_url:existing.rtsp_url,width:String(existing.width),height:String(existing.height),framerate:String(existing.framerate)}
    : {name:'',rtsp_url:'',width:'1920',height:'1080',framerate:'15'})
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}))
  const handleSave = async () => {
    if(!form.name.trim()) return setError('Camera name is required')
    if(!form.rtsp_url.trim()) return setError('RTSP URL is required')
    if(!form.rtsp_url.startsWith('rtsp://')) return setError('URL must start with rtsp://')
    setSaving(true); setError('')
    const body={name:form.name.trim(),rtsp_url:form.rtsp_url.trim(),width:parseInt(form.width)||1920,height:parseInt(form.height)||1080,framerate:parseInt(form.framerate)||15}
    const res = existing ? await patch(`/cameras/${existing.id}`,body) : await post('/cameras',body)
    setSaving(false)
    if(res.camera){onSave(res.camera,res.onvif);onClose()}
    else setError(res.detail||'Failed to save camera')
  }
  const inp = (label,key,ph,type='text') => (
    <div style={{marginBottom:12}}>
      <label style={{display:'block',fontSize:12,color:'#94a3b8',marginBottom:4}}>{label}</label>
      <input type={type} value={form[key]} onChange={f(key)} placeholder={ph}
        style={{width:'100%',padding:'10px 12px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#e2e8f0',fontSize:14,outline:'none'}}/>
    </div>
  )
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:16}}>
      <div style={{background:'#1e293b',border:'1px solid #334155',borderRadius:14,padding:24,width:'100%',maxWidth:440}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h3 style={{fontSize:17,fontWeight:700,color:'#f1f5f9'}}>{existing?'Edit Camera':'Add Camera'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b'}}><X size={18}/></button>
        </div>
        {inp('Camera Name','name','e.g. Front Door')}
        {inp('RTSP URL','rtsp_url','rtsp://192.168.1.x:8554/camera-name')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[['Width','width','1920'],['Height','height','1080'],['FPS','framerate','15']].map(([label,key,ph])=>(
            <div key={key}>
              <label style={{display:'block',fontSize:12,color:'#94a3b8',marginBottom:4}}>{label}</label>
              <input type="number" value={form[key]} onChange={f(key)} placeholder={ph}
                style={{width:'100%',padding:'10px 12px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#e2e8f0',fontSize:14}}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:10,background:'#0c1a0c',border:'1px solid #14532d',borderRadius:8}}>
          <p style={{fontSize:12,color:'#4ade80'}}>In Scrypted: open your camera → RTSP tab → copy the stream URL</p>
        </div>
        {error&&<div style={{marginTop:10,padding:10,background:'#2d0f0f',border:'1px solid #7f1d1d',borderRadius:8,color:'#fca5a5',fontSize:13}}>{error}</div>}
        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button onClick={onClose} style={{flex:1,padding:10,background:'#1e293b',border:'1px solid #334155',borderRadius:8,cursor:'pointer',color:'#94a3b8',fontSize:14}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{flex:2,padding:10,background:saving?'#1e3a5f':'#3b82f6',color:'white',border:'none',borderRadius:8,cursor:saving?'not-allowed':'pointer',fontWeight:600,fontSize:14}}>
            {saving?'Saving...':(existing?'Save Changes':'Add Camera')}
          </button>
        </div>
      </div>
    </div>
  )
}

function CameraCard({camera,onDelete,onEdit,onONVIF}) {
  return (
    <div style={{background:'#1e293b',border:'1px solid #334155',borderRadius:12,padding:'15px 17px',display:'flex',alignItems:'center',gap:13}}>
      <div style={{width:41,height:41,background:'#0f172a',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Video size={18} color="#3b82f6"/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:14,color:'#f1f5f9',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{camera.name}</div>
        <div style={{fontSize:11,color:'#334155',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:4}}>{camera.rtsp_url}</div>
        <div style={{display:'flex',gap:7,alignItems:'center'}}>
          <span style={{fontSize:10,padding:'2px 7px',background:'#1e3a5c',color:'#60a5fa',borderRadius:20,fontWeight:600}}>{camera.width}x{camera.height}</span>
          <span style={{fontSize:10,padding:'2px 7px',background:'#1e3a5c',color:'#60a5fa',borderRadius:20,fontWeight:600}}>{camera.framerate}fps</span>
          <span style={{fontSize:11,color:'#334155'}}>:{camera.onvif_port}</span>
        </div>
      </div>
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        <button onClick={()=>onONVIF(camera.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'7px 11px',background:'#0c1a2e',border:'1px solid #1e3a5f',borderRadius:7,cursor:'pointer',color:'#60a5fa',fontSize:12,fontWeight:600}}><Wifi size={12}/>ONVIF</button>
        <button onClick={()=>onEdit(camera)} style={{padding:'7px 9px',background:'#1e293b',border:'1px solid #334155',borderRadius:7,cursor:'pointer',color:'#64748b'}}><Edit2 size={13}/></button>
        <button onClick={()=>onDelete(camera.id)} style={{padding:'7px 9px',background:'#2d0f0f',border:'1px solid #4d2020',borderRadius:7,cursor:'pointer',color:'#f87171'}}><Trash2 size={13}/></button>
      </div>
    </div>
  )
}

export default function App() {
  const [cameras,setCameras]=useState([])
  const [status,setStatus]=useState(null)
  const [showAdd,setShowAdd]=useState(false)
  const [editing,setEditing]=useState(null)
  const [onvifInfo,setOnvifInfo]=useState(null)
  const [loading,setLoading]=useState(true)
  const refresh = useCallback(async()=>{
    const [camRes,statRes]=await Promise.all([get('/cameras'),get('/status')])
    setCameras(camRes?.cameras||[]); setStatus(statRes); setLoading(false)
  },[])
  useEffect(()=>{refresh()},[refresh])
  const handleDelete = async id=>{
    if(!confirm('Remove this camera?')) return
    await del(`/cameras/${id}`); refresh()
  }
  const handleSave = (camera,onvif)=>{ refresh(); if(onvif&&!editing) setOnvifInfo(onvif) }
  const handleONVIF = async id=>{ const res=await get(`/cameras/${id}/onvif`); setOnvifInfo(res) }
  return (
    <div style={{minHeight:'100vh',background:'#0f172a'}}>
      <div style={{background:'#1e293b',borderBottom:'1px solid #334155',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:35,height:35,background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}><Camera size={18} color="white"/></div>
          <div><h1 style={{fontSize:16,fontWeight:700,color:'#f1f5f9',lineHeight:1.2}}>CloudCam Bridge</h1><p style={{fontSize:10,color:'#475569'}}>Scrypted RTSP → UniFi Protect ONVIF</p></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {status&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 9px',background:'#022c22',border:'1px solid #064e3b',borderRadius:20}}><div style={{width:5,height:5,borderRadius:'50%',background:'#34d399'}}/><span style={{fontSize:11,color:'#34d399',fontWeight:600}}>Running</span></div>}
          <button onClick={refresh} style={{padding:6,background:'none',border:'1px solid #334155',borderRadius:7,cursor:'pointer',color:'#64748b'}}><RefreshCw size={13}/></button>
        </div>
      </div>
      <div style={{maxWidth:720,margin:'0 auto',padding:'18px 14px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:18}}>
          {[{icon:'🎥',value:cameras.length,label:'Cameras'},{icon:'📡',value:cameras.length,label:'ONVIF Servers'},{icon:'🔄',value:status?.go2rtc_streams??0,label:'Streams'}].map(s=>(
            <div key={s.label} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:9,padding:'12px 14px'}}>
              <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>{s.value}</div>
              <div style={{fontSize:10,color:'#475569'}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <h2 style={{fontSize:14,fontWeight:600,color:'#f1f5f9'}}>Cameras</h2>
          <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',background:'#3b82f6',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontWeight:600,fontSize:13}}><Plus size={13}/>Add Camera</button>
        </div>
        {loading?(
          <div style={{textAlign:'center',padding:36,color:'#334155'}}>Loading...</div>
        ):cameras.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px',background:'#1e293b',borderRadius:12,border:'1px dashed #334155'}}>
            <Camera size={36} color="#334155" style={{margin:'0 auto 10px',display:'block'}}/>
            <h3 style={{color:'#475569',marginBottom:5,fontSize:14}}>No cameras yet</h3>
            <p style={{color:'#334155',fontSize:12,marginBottom:16,maxWidth:300,margin:'0 auto 16px'}}>Grab an RTSP URL from Scrypted and paste it here — each camera becomes an ONVIF device Protect can record.</p>
            <button onClick={()=>setShowAdd(true)} style={{padding:'8px 18px',background:'#3b82f6',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontWeight:600,fontSize:13}}>Add Your First Camera</button>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {cameras.map(cam=><CameraCard key={cam.id} camera={cam} onDelete={handleDelete} onEdit={c=>setEditing(c)} onONVIF={handleONVIF}/>)}
          </div>
        )}
        {cameras.length>0&&(
          <div style={{marginTop:18,padding:13,background:'#1a2744',border:'1px solid #1e3a5f',borderRadius:9}}>
            <h4 style={{color:'#93c5fd',fontSize:12,fontWeight:600,marginBottom:7}}>How to add to UniFi Protect</h4>
            <ol style={{color:'#475569',fontSize:12,paddingLeft:15,lineHeight:2}}>
              <li>Click <strong style={{color:'#93c5fd'}}>ONVIF</strong> on a camera above to get its connection details</li>
              <li>In Protect: <strong style={{color:'#93c5fd'}}>Settings → Cameras → Add Camera → Third-Party ONVIF</strong></li>
              <li>Enter the IP, port, username, and password</li>
            </ol>
          </div>
        )}
        <div style={{marginTop:10,padding:11,background:'#0c1a0c',border:'1px solid #14532d',borderRadius:9,display:'flex',gap:8}}>
          <span style={{flexShrink:0}}>🔒</span>
          <p style={{fontSize:12,color:'#16a34a',lineHeight:1.5}}><strong>Fully local.</strong> Streams flow directly from Scrypted to UniFi Protect on your network. No cloud relay, no external connections.</p>
        </div>
      </div>
      {showAdd&&<CameraModal onSave={handleSave} onClose={()=>setShowAdd(false)}/>}
      {editing&&<CameraModal existing={editing} onSave={handleSave} onClose={()=>setEditing(null)}/>}
      {onvifInfo&&<ONVIFPanel info={onvifInfo} onClose={()=>setOnvifInfo(null)}/>}
    </div>
  )
}

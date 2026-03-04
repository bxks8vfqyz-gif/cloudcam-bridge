import argparse, asyncio, logging, os, socket
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from go2rtc_manager import Go2RTCManager
from camera_store import CameraStore, Camera

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

go2rtc = None; store = None
HOST_IP = "127.0.0.1"
ONVIF_USERNAME = "admin"
ONVIF_PASSWORD = "cloudcam123"
_onvif_procs = {}

@asynccontextmanager
async def lifespan(app):
    logger.info("CloudCam Bridge starting...")
    await store.load()
    streams = {c.stream_id: c.rtsp_url for c in store.all()}
    if streams: await go2rtc.set_all_streams(streams)
    for cam in store.all(): await _start_onvif(cam)
    logger.info(f"Ready - {len(store.all())} camera(s)")
    yield
    for cid, proc in list(_onvif_procs.items()):
        try: proc.terminate()
        except: pass

app = FastAPI(title="CloudCam Bridge", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class AddCameraBody(BaseModel):
    name: str; rtsp_url: str; width: int = 1920; height: int = 1080; framerate: int = 15

class UpdateCameraBody(BaseModel):
    name: Optional[str] = None; rtsp_url: Optional[str] = None
    width: Optional[int] = None; height: Optional[int] = None; framerate: Optional[int] = None

@app.get("/api/cameras")
async def list_cameras(): return {"cameras": [c.to_dict() for c in store.all()]}

@app.post("/api/cameras")
async def add_camera(body: AddCameraBody):
    cam = await store.add(name=body.name, rtsp_url=body.rtsp_url, width=body.width, height=body.height, framerate=body.framerate)
    await go2rtc.add_stream(cam.stream_id, cam.rtsp_url)
    await _start_onvif(cam)
    logger.info(f"Added camera '{cam.name}' ONVIF port {cam.onvif_port}")
    return {"camera": cam.to_dict(), "onvif": _onvif_info(cam)}

@app.get("/api/cameras/{camera_id}")
async def get_camera(camera_id: str):
    cam = store.get(camera_id)
    if not cam: raise HTTPException(404, "Camera not found")
    return {"camera": cam.to_dict(), "onvif": _onvif_info(cam)}

@app.patch("/api/cameras/{camera_id}")
async def update_camera(camera_id: str, body: UpdateCameraBody):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    cam = await store.update(camera_id, **updates)
    if not cam: raise HTTPException(404, "Camera not found")
    if "rtsp_url" in updates:
        await go2rtc.add_stream(cam.stream_id, cam.rtsp_url)
        await _stop_onvif(camera_id); await _start_onvif(cam)
    return {"camera": cam.to_dict(), "onvif": _onvif_info(cam)}

@app.delete("/api/cameras/{camera_id}")
async def remove_camera(camera_id: str):
    cam = await store.remove(camera_id)
    if not cam: raise HTTPException(404, "Camera not found")
    await _stop_onvif(camera_id); await go2rtc.remove_stream(cam.stream_id)
    return {"success": True}

@app.get("/api/cameras/{camera_id}/onvif")
async def get_onvif(camera_id: str):
    cam = store.get(camera_id)
    if not cam: raise HTTPException(404, "Camera not found")
    return _onvif_info(cam)

@app.get("/api/status")
async def get_status():
    streams = await go2rtc.get_streams_status()
    return {"status": "running", "cameras": len(store.all()), "go2rtc_streams": len(streams)}

def _onvif_info(cam):
    return {"host": HOST_IP, "port": cam.onvif_port, "username": ONVIF_USERNAME,
            "password": ONVIF_PASSWORD, "onvif_url": f"http://{HOST_IP}:{cam.onvif_port}/onvif/device_service",
            "rtsp_relay": go2rtc.get_rtsp_url(cam.stream_id)}

async def _start_onvif(cam):
    if cam.id in _onvif_procs: await _stop_onvif(cam.id)
    rtsp = go2rtc.get_rtsp_url(cam.stream_id)
    cmd = ["python3", "/app/backend/onvif_server.py",
           "--port", str(cam.onvif_port), "--name", cam.name, "--camera-id", cam.id,
           "--rtsp-url", rtsp, "--width", str(cam.width), "--height", str(cam.height),
           "--framerate", str(cam.framerate), "--username", ONVIF_USERNAME, "--password", ONVIF_PASSWORD]
    proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
    _onvif_procs[cam.id] = proc
    logger.info(f"ONVIF server '{cam.name}' port {cam.onvif_port} pid={proc.pid}")

async def _stop_onvif(camera_id):
    proc = _onvif_procs.pop(camera_id, None)
    if proc:
        try: proc.terminate(); await asyncio.wait_for(proc.wait(), timeout=5)
        except: proc.kill()

FRONTEND = "/app/frontend/dist"
if os.path.exists(FRONTEND):
    app.mount("/assets", StaticFiles(directory=f"{FRONTEND}/assets"), name="assets")
    @app.get("/{full_path:path}")
    async def ui(full_path: str): return FileResponse(f"{FRONTEND}/index.html")

if __name__ == "__main__":
    import uvicorn
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--data-file", default="/data/cameras.json")
    parser.add_argument("--go2rtc-config", default="/data/go2rtc.yaml")
    parser.add_argument("--onvif-username", default="admin")
    parser.add_argument("--onvif-password", default="cloudcam123")
    parser.add_argument("--log-level", default="info")
    args = parser.parse_args()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80)); HOST_IP = s.getsockname()[0]; s.close()
    except: HOST_IP = "127.0.0.1"
    logger.info(f"Host IP: {HOST_IP}")
    ONVIF_USERNAME = args.onvif_username
    ONVIF_PASSWORD = args.onvif_password
    go2rtc = Go2RTCManager(args.go2rtc_config)
    store = CameraStore(args.data_file)
    uvicorn.run(app, host=args.host, port=args.port, log_level=args.log_level.lower())
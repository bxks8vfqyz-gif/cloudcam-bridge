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
from scrypted_discover import discover_cameras
from ring_manager import RingManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

go2rtc = None; store = None; ring = None
HOST_IP = "127.0.0.1"
ONVIF_USERNAME = "admin"
ONVIF_PASSWORD = "cloudcam123"
SCRYPTED_ADDRESS = ""
SCRYPTED_TOKEN = ""
_onvif_procs = {}

@asynccontextmanager
async def lifespan(app):
    logger.info("CloudCam Bridge starting...")
    await store.load()
    streams = {}
    for c in store.all():
        if c.source_type == "ring" and c.device_id and ring and ring.is_authenticated:
            streams[c.stream_id] = ring.get_go2rtc_url(c.device_id)
        else:
            streams[c.stream_id] = c.rtsp_url
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
    name: str; rtsp_url: str = ""; width: int = 1920; height: int = 1080; framerate: int = 15
    source_type: str = "rtsp"; device_id: str = ""

class UpdateCameraBody(BaseModel):
    name: Optional[str] = None; rtsp_url: Optional[str] = None
    width: Optional[int] = None; height: Optional[int] = None; framerate: Optional[int] = None

@app.get("/api/cameras")
async def list_cameras(): return {"cameras": [c.to_dict() for c in store.all()]}

@app.post("/api/cameras")
async def add_camera(body: AddCameraBody):
    rtsp_url = body.rtsp_url
    # For Ring cameras, build the go2rtc ring:// URL
    if body.source_type == "ring":
        if not ring or not ring.is_authenticated:
            raise HTTPException(400, "Ring not authenticated")
        if not body.device_id:
            raise HTTPException(400, "device_id required for Ring cameras")
        rtsp_url = ring.get_go2rtc_url(body.device_id)
    cam = await store.add(name=body.name, rtsp_url=rtsp_url, width=body.width, height=body.height,
                          framerate=body.framerate, source_type=body.source_type, device_id=body.device_id)
    await go2rtc.add_stream(cam.stream_id, rtsp_url)
    await _start_onvif(cam)
    logger.info(f"Added camera '{cam.name}' ({body.source_type}) ONVIF port {cam.onvif_port}")
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

ADDON_VERSION = "2.1.8"
ADDON_SLUG = "71440562_cloudcam-bridge"

@app.get("/api/status")
async def get_status():
    streams = await go2rtc.get_streams_status()
    return {"status": "running", "cameras": len(store.all()), "go2rtc_streams": len(streams), "version": ADDON_VERSION}

@app.get("/api/version")
async def get_version():
    """Check if a newer version is available from the repo."""
    import os
    supervisor_token = os.environ.get("SUPERVISOR_TOKEN", "")
    if not supervisor_token:
        return {"current": ADDON_VERSION, "available": None, "update_available": False, "error": "Not running in HA"}
    try:
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: requests.get(
            f"http://supervisor/addons/{ADDON_SLUG}/info",
            headers={"Authorization": f"Bearer {supervisor_token}"},
            timeout=10
        ))
        data = resp.json().get("data", {})
        return {
            "current": data.get("version", ADDON_VERSION),
            "available": data.get("version_latest", ADDON_VERSION),
            "update_available": data.get("update_available", False),
        }
    except Exception as e:
        return {"current": ADDON_VERSION, "available": None, "update_available": False, "error": str(e)}

@app.post("/api/force-update")
async def force_update():
    """Refresh the repo, then rebuild the add-on with the latest code."""
    import os
    supervisor_token = os.environ.get("SUPERVISOR_TOKEN", "")
    if not supervisor_token:
        return {"success": False, "error": "Not running in Home Assistant"}
    headers = {"Authorization": f"Bearer {supervisor_token}"}
    try:
        loop = asyncio.get_event_loop()
        # Step 1: Refresh all store repos to pull latest git changes
        logger.info("Force update: refreshing store repos...")
        await loop.run_in_executor(None, lambda: requests.post(
            "http://supervisor/store/reload",
            headers=headers, timeout=30
        ))
        # Step 2: Check if update is available now
        resp = await loop.run_in_executor(None, lambda: requests.get(
            f"http://supervisor/addons/{ADDON_SLUG}/info",
            headers=headers, timeout=10
        ))
        info = resp.json().get("data", {})
        if info.get("update_available"):
            # Step 3: Trigger the update
            logger.info(f"Force update: updating from {info.get('version')} to {info.get('version_latest')}...")
            await loop.run_in_executor(None, lambda: requests.post(
                f"http://supervisor/addons/{ADDON_SLUG}/update",
                headers=headers, timeout=300
            ))
            return {"success": True, "message": f"Updated to {info.get('version_latest')}. Add-on will restart."}
        else:
            # No version change — do a rebuild instead
            logger.info("Force update: no new version, triggering rebuild...")
            await loop.run_in_executor(None, lambda: requests.post(
                f"http://supervisor/addons/{ADDON_SLUG}/rebuild",
                headers=headers, timeout=300
            ))
            return {"success": True, "message": "Rebuild triggered. Add-on will restart."}
    except Exception as e:
        logger.error(f"Force update error: {e}")
        return {"success": False, "error": str(e)}

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

# ── Ring endpoints ──────────────────────────────────────────────

class RingAuthBody(BaseModel):
    username: str; password: str; twofactor_code: str = ""

@app.post("/api/ring/auth")
async def ring_auth(body: RingAuthBody):
    if not ring:
        raise HTTPException(500, "Ring manager not initialized")
    result = await ring.authenticate(body.username, body.password, body.twofactor_code)
    return result

@app.get("/api/ring/status")
async def ring_status():
    return {"authenticated": ring.is_authenticated if ring else False}

@app.get("/api/ring/discover")
async def ring_discover():
    if not ring or not ring.is_authenticated:
        return {"cameras": [], "error": "Ring not authenticated. Enter credentials above."}
    try:
        existing_ids = {c.device_id for c in store.all() if c.source_type == "ring"}
        cams = await ring.discover_cameras()
        for c in cams:
            c["already_added"] = c["device_id"] in existing_ids
        return {"cameras": cams}
    except Exception as e:
        logger.error(f"Ring discovery error: {e}")
        return {"cameras": [], "error": f"Discovery failed: {e}"}

@app.post("/api/ring/disconnect")
async def ring_disconnect():
    if ring: ring.disconnect()
    return {"success": True}

# ── Scrypted endpoints ──────────────────────────────────────────

@app.get("/api/discover/scrypted")
async def discover_scrypted():
    if not SCRYPTED_ADDRESS or not SCRYPTED_TOKEN:
        return {"cameras": [], "error": "Scrypted not configured. Set address and token in add-on Configuration tab."}
    try:
        existing_urls = {c.rtsp_url for c in store.all()}
        cams = await discover_cameras(SCRYPTED_ADDRESS, SCRYPTED_TOKEN)
        for c in cams:
            c['already_added'] = c.get('rtsp_url', '') in existing_urls
        return {"cameras": cams}
    except ValueError as e:
        return {"cameras": [], "error": str(e)}
    except Exception as e:
        logger.error(f"Scrypted discovery error: {e}")
        return {"cameras": [], "error": f"Discovery failed: {e}"}

@app.get("/api/scrypted/status")
async def scrypted_status():
    return {"configured": bool(SCRYPTED_ADDRESS and SCRYPTED_TOKEN), "address": SCRYPTED_ADDRESS}

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
    parser.add_argument("--scrypted-address", default="")
    parser.add_argument("--scrypted-token", default="")
    args = parser.parse_args()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80)); HOST_IP = s.getsockname()[0]; s.close()
    except: HOST_IP = "127.0.0.1"
    logger.info(f"Host IP: {HOST_IP}")
    ONVIF_USERNAME = args.onvif_username
    ONVIF_PASSWORD = args.onvif_password
    SCRYPTED_ADDRESS = args.scrypted_address
    SCRYPTED_TOKEN = args.scrypted_token
    go2rtc = Go2RTCManager(args.go2rtc_config, HOST_IP)
    store = CameraStore(args.data_file)
    ring = RingManager()
    uvicorn.run(app, host=args.host, port=args.port, log_level=args.log_level.lower())
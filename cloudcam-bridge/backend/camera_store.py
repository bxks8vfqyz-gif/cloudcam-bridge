import json, uuid, logging, aiofiles
from typing import List, Optional, Dict
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)
ONVIF_BASE_PORT = 9000

@dataclass
class Camera:
    id: str
    name: str
    rtsp_url: str
    stream_id: str
    onvif_port: int
    width: int = 1920
    height: int = 1080
    framerate: int = 15
    source_type: str = "rtsp"      # "rtsp" or "ring"
    device_id: str = ""            # Ring device ID (empty for RTSP cameras)

    def to_dict(self):
        return asdict(self)


class CameraStore:
    def __init__(self, data_file: str):
        self.data_file = data_file
        self._cameras: Dict[str, Camera] = {}

    async def load(self):
        try:
            async with aiofiles.open(self.data_file) as f:
                data = json.loads(await f.read())
            for d in data.get("cameras", []):
                cam = Camera(**d)
                self._cameras[cam.id] = cam
            logger.info(f"Loaded {len(self._cameras)} cameras")
        except Exception:
            logger.info("Starting fresh — no cameras file found")

    async def save(self):
        async with aiofiles.open(self.data_file, "w") as f:
            await f.write(json.dumps(
                {"cameras": [asdict(c) for c in self._cameras.values()]},
                indent=2
            ))

    def all(self) -> List[Camera]:
        return list(self._cameras.values())

    def get(self, camera_id: str) -> Optional[Camera]:
        return self._cameras.get(camera_id)

    async def add(self, name: str, rtsp_url: str,
                  width: int = 1920, height: int = 1080, framerate: int = 15,
                  source_type: str = "rtsp", device_id: str = "") -> Camera:
        cid = str(uuid.uuid4())
        sid = f"cam_{cid[:8]}"
        port = self._next_port()
        cam = Camera(id=cid, name=name, rtsp_url=rtsp_url,
                     stream_id=sid, onvif_port=port,
                     width=width, height=height, framerate=framerate,
                     source_type=source_type, device_id=device_id)
        self._cameras[cid] = cam
        await self.save()
        return cam

    async def remove(self, camera_id: str) -> Optional[Camera]:
        cam = self._cameras.pop(camera_id, None)
        if cam:
            await self.save()
        return cam

    async def update(self, camera_id: str, **kwargs) -> Optional[Camera]:
        cam = self._cameras.get(camera_id)
        if not cam:
            return None
        for k, v in kwargs.items():
            if hasattr(cam, k) and k not in ("id", "stream_id", "onvif_port"):
                setattr(cam, k, v)
        await self.save()
        return cam

    def _next_port(self) -> int:
        used = {c.onvif_port for c in self._cameras.values()}
        p = ONVIF_BASE_PORT
        while p in used:
            p += 1
        return p

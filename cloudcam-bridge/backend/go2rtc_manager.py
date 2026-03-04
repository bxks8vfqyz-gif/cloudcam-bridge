"""Manages go2rtc config and API — handles stream relay from Scrypted RTSP URLs."""
import asyncio, logging, yaml, aiofiles, requests
from typing import Dict

logger = logging.getLogger(__name__)
GO2RTC_API = "http://127.0.0.1:1984"

class Go2RTCManager:
    def __init__(self, config_path: str):
        self.config_path = config_path

    async def load_config(self) -> dict:
        try:
            async with aiofiles.open(self.config_path, "r") as f:
                return yaml.safe_load(await f.read()) or {}
        except FileNotFoundError:
            return {"api": {"listen": "127.0.0.1:1984"}, "rtsp": {"listen": "127.0.0.1:8554"}, "streams": {}}

    async def save_config(self, config: dict):
        async with aiofiles.open(self.config_path, "w") as f:
            await f.write(yaml.dump(config, default_flow_style=False))

    async def add_stream(self, stream_id: str, rtsp_url: str):
        config = await self.load_config()
        config.setdefault("streams", {})[stream_id] = rtsp_url
        await self.save_config(config)
        await self._reload()
        logger.info(f"go2rtc: added '{stream_id}' -> '{rtsp_url}'")

    async def remove_stream(self, stream_id: str):
        config = await self.load_config()
        config.get("streams", {}).pop(stream_id, None)
        await self.save_config(config)
        await self._reload()

    async def set_all_streams(self, streams: Dict[str, str]):
        config = await self.load_config()
        config["streams"] = streams
        await self.save_config(config)
        await self._reload()

    def get_rtsp_url(self, stream_id: str) -> str:
        return f"rtsp://127.0.0.1:8554/{stream_id}"

    async def _reload(self):
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: requests.post(f"{GO2RTC_API}/api/restart", timeout=5))
        except Exception as e:
            logger.debug(f"go2rtc reload: {e}")

    async def get_streams_status(self) -> dict:
        try:
            loop = asyncio.get_event_loop()
            resp = await loop.run_in_executor(None, lambda: requests.get(f"{GO2RTC_API}/api/streams", timeout=5))
            return resp.json()
        except Exception:
            return {}

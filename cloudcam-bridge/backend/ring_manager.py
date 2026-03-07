"""Ring camera authentication and discovery using ring-doorbell library.
go2rtc handles the actual video streaming via its built-in ring:// protocol."""

import json, logging, os
from pathlib import Path
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

TOKEN_FILE = "/data/ring_token.json"


class RingManager:
    def __init__(self, token_file: str = TOKEN_FILE):
        self.token_file = token_file
        self._refresh_token: Optional[str] = None
        self._token: Optional[dict] = None
        self._load_token()

    def _load_token(self):
        """Load saved token from disk."""
        try:
            if os.path.exists(self.token_file):
                with open(self.token_file) as f:
                    data = json.load(f)
                if "refresh_token" in data:
                    self._token = data
                    self._refresh_token = data["refresh_token"]
                    logger.info("Ring: loaded saved token")
        except Exception as e:
            logger.warning(f"Ring: failed to load token: {e}")

    def _save_token(self, token: dict = None):
        """Persist token to disk."""
        try:
            Path(self.token_file).parent.mkdir(parents=True, exist_ok=True)
            save_data = token if token else {"refresh_token": self._refresh_token}
            with open(self.token_file, "w") as f:
                json.dump(save_data, f)
            logger.info("Ring: saved token")
        except Exception as e:
            logger.error(f"Ring: failed to save token: {e}")

    @property
    def is_authenticated(self) -> bool:
        return self._refresh_token is not None

    @property
    def refresh_token(self) -> Optional[str]:
        return self._refresh_token

    async def authenticate(self, username: str, password: str, twofactor_code: str = "") -> Dict:
        """Authenticate with Ring and store refresh token.
        Returns dict with success status and any error message."""
        try:
            from ring_doorbell import Auth, AuthenticationError, Requires2FAError
            import asyncio

            def _token_updated(token):
                self._token = token
                self._refresh_token = token["refresh_token"]
                self._save_token(token)

            auth = Auth("CloudCamBridge/2.0", None, _token_updated)

            try:
                await auth.async_fetch_token(username, password, twofactor_code or None)
            except Requires2FAError:
                return {"success": False, "needs_2fa": True, "error": "2FA code required. Check your phone/email and try again with the code."}
            except AuthenticationError as e:
                return {"success": False, "needs_2fa": False, "error": f"Authentication failed: {e}"}

            # Token callback should have fired, but just in case
            if not self._refresh_token and auth.token:
                self._token = auth.token
                self._refresh_token = auth.token.get("refresh_token")
                self._save_token(auth.token)

            return {"success": True, "needs_2fa": False, "error": None}

        except ImportError:
            return {"success": False, "needs_2fa": False, "error": "ring-doorbell library not installed"}
        except Exception as e:
            logger.error(f"Ring auth error: {e}")
            return {"success": False, "needs_2fa": False, "error": str(e)}

    async def discover_cameras(self) -> List[Dict]:
        """Discover all Ring cameras using saved refresh token."""
        if not self._refresh_token:
            raise ValueError("Not authenticated with Ring")

        try:
            from ring_doorbell import Auth, Ring
            import asyncio

            def _token_updated(token):
                self._token = token
                self._refresh_token = token["refresh_token"]
                self._save_token(token)

            auth = Auth("CloudCamBridge/2.0", self._token or {"refresh_token": self._refresh_token}, _token_updated)

            ring = Ring(auth)
            await ring.async_create_session()
            await ring.async_update_data()

            cameras = []
            devices = ring.devices()
            # Doorbells
            for device in getattr(devices, "doorbots", []) or []:
                cameras.append({
                    "device_id": str(device.id),
                    "name": device.name,
                    "type": "doorbell",
                    "model": getattr(device, "model", "Ring Doorbell"),
                    "battery": getattr(device, "battery_life", None),
                })
            # Stickup cams (includes indoor/outdoor/floodlight/spotlight)
            for device in getattr(devices, "stickup_cams", []) or []:
                cameras.append({
                    "device_id": str(device.id),
                    "name": device.name,
                    "type": "camera",
                    "model": getattr(device, "model", "Ring Camera"),
                    "battery": getattr(device, "battery_life", None),
                })
            # Also check authorized_doorbots
            for device in getattr(devices, "authorized_doorbots", []) or []:
                if not any(c["device_id"] == str(device.id) for c in cameras):
                    cameras.append({
                        "device_id": str(device.id),
                        "name": device.name,
                        "type": "doorbell",
                        "model": getattr(device, "model", "Ring Doorbell"),
                        "battery": getattr(device, "battery_life", None),
                    })

            logger.info(f"Ring: discovered {len(cameras)} camera(s)")
            return cameras

        except Exception as e:
            logger.error(f"Ring discovery error: {e}")
            raise

    def get_go2rtc_url(self, device_id: str) -> str:
        """Build go2rtc ring:// source URL for a device."""
        if not self._refresh_token:
            raise ValueError("Not authenticated with Ring")
        return f"ring://{device_id}?refresh_token={self._refresh_token}"

    def disconnect(self):
        """Remove stored Ring credentials."""
        self._refresh_token = None
        try:
            if os.path.exists(self.token_file):
                os.remove(self.token_file)
            logger.info("Ring: disconnected and removed token")
        except Exception as e:
            logger.warning(f"Ring: failed to remove token file: {e}")

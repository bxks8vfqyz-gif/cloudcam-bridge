"""Discover cameras from a Scrypted server."""

import logging, httpx

logger = logging.getLogger(__name__)

async def discover_cameras(address: str, token: str) -> list[dict]:
    """
    Query a Scrypted server and return a list of cameras with RTSP URLs.

    address: e.g. "https://192.168.1.251:10443" or "192.168.1.251"
    token:   Scrypted API token (from Scrypted Settings -> Integrations)
    """
    if not address or not token:
        return []

    # Normalize address
    addr = address.strip().rstrip('/')
    if not addr.startswith('http'):
        addr = f"https://{addr}"
    if ':' not in addr.split('://', 1)[1]:
        addr += ':10443'

    headers = {"Authorization": f"Bearer {token}"}
    cameras = []

    async with httpx.AsyncClient(verify=False, timeout=10) as client:
        # Get system state which contains all devices
        try:
            resp = await client.get(f"{addr}/endpoint/@scrypted/core/public/", headers=headers)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.error(f"Failed to connect to Scrypted at {addr}: {e}")
            raise ValueError(f"Cannot connect to Scrypted: {e}")

        # data['state'] is a dict of device_id -> device_state
        state = data.get('state', data) if isinstance(data, dict) else {}

        # Also try the /endpoint/@scrypted/core/public endpoint format
        if not state or not isinstance(state, dict):
            try:
                resp = await client.get(f"{addr}/endpoint/@scrypted/core/api/state", headers=headers)
                resp.raise_for_status()
                state = resp.json()
            except:
                pass

        if not isinstance(state, dict):
            logger.warning(f"Unexpected Scrypted response format")
            return []

        for device_id, device in state.items():
            if not isinstance(device, dict):
                continue

            interfaces = device.get('interfaces', {})
            iface_list = interfaces.get('value', interfaces) if isinstance(interfaces, dict) else interfaces
            if not isinstance(iface_list, list):
                continue

            # Only include devices with VideoCamera interface
            if 'VideoCamera' not in iface_list and 'Camera' not in iface_list:
                continue

            name_info = device.get('name', {})
            name = name_info.get('value', name_info) if isinstance(name_info, dict) else str(name_info)
            if not name:
                continue

            type_info = device.get('type', {})
            dev_type = type_info.get('value', type_info) if isinstance(type_info, dict) else str(type_info)

            # Try to find RTSP URL from device info
            rtsp_url = ""

            # Check if device has an rtspUrl or similar property
            for key in ['rtspUrl', 'url', 'rtspAddress']:
                val = device.get(key, {})
                v = val.get('value', val) if isinstance(val, dict) else val
                if isinstance(v, str) and v.startswith('rtsp://'):
                    rtsp_url = v
                    break

            # Get resolution info
            width, height, fps = 1920, 1080, 15
            for key in ['videoResolution', 'resolution']:
                val = device.get(key, {})
                v = val.get('value', val) if isinstance(val, dict) else val
                if isinstance(v, dict):
                    width = v.get('width', width)
                    height = v.get('height', height)
                    fps = v.get('fps', fps)

            cameras.append({
                'id': str(device_id),
                'name': str(name),
                'type': str(dev_type) if dev_type else 'Camera',
                'rtsp_url': rtsp_url,
                'width': width,
                'height': height,
                'framerate': fps,
                'interfaces': [i for i in iface_list if isinstance(i, str)],
            })

    cameras.sort(key=lambda c: c['name'])
    logger.info(f"Discovered {len(cameras)} cameras from Scrypted")
    return cameras

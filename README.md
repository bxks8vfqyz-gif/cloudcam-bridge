# CloudCam Bridge

A Home Assistant Add-on that converts local RTSP streams from Scrypted into ONVIF cameras for UniFi Protect.

## How it works

```
Scrypted (local RTSP) → CloudCam Bridge → ONVIF → UniFi Protect
```

1. Paste your Scrypted RTSP URL into the UI
2. CloudCam Bridge relays it via go2rtc and exposes it as an ONVIF camera
3. UniFi Protect connects to it like any native camera

**Fully local — no cloud relay, no internet required after setup.**

## Installation

1. Home Assistant → **Settings → Add-ons → Add-on Store → ⋮ → Repositories**
2. Add: `https://github.com/bxks8vfqyz-gif/cloudcam-bridge`
3. Install **CloudCam Bridge**
4. Set your ONVIF credentials in the add-on config panel
5. Start the add-on and open the Web UI

## Getting your RTSP URL from Scrypted

1. Open Scrypted → click your camera
2. Go to the **RTSP** or **Rebroadcast** tab
3. Copy the URL — it looks like `rtsp://192.168.1.x:8554/camera-name`
4. Paste it into CloudCam Bridge

## Adding to UniFi Protect

1. Add the camera in CloudCam Bridge UI
2. Click **ONVIF** on any camera to see its connection details
3. In UniFi Protect: **Settings → Cameras → Add Camera → Third-Party ONVIF Camera**
4. Enter the IP, port, username, and password shown

## Configuration

Set in the HA add-on config panel:

| Option | Default | Description |
|--------|---------|-------------|
| `onvif_username` | `admin` | What UniFi Protect uses to connect |
| `onvif_password` | `cloudcam123` | What UniFi Protect uses to connect |
| `log_level` | `info` | Log verbosity |

## Port usage

| Port | Purpose |
|------|---------|
| 8080 | Web UI (via HA ingress) |
| 9000+ | One ONVIF server per camera |
| 8554 | go2rtc RTSP relay (localhost only) |
| 1984 | go2rtc API (localhost only) |
| 3702 | WS-Discovery UDP for auto-detection |

## Privacy

- go2rtc is bound to `127.0.0.1` — not reachable from outside the container
- ONVIF servers use your LAN IP — not accessible from the internet
- Camera config stored locally in your HA add-on config directory
- Zero telemetry

## License

MIT

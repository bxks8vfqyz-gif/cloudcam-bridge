# Changelog

## 2.1.6
- Fix copy button in ONVIF panel — works inside HA ingress iframe now

## 2.1.5
- Fix Ring camera streaming: correct go2rtc URL format from ring:// to ring:?device_id=&refresh_token=

## 2.1.4
- Add Force Update button in header — refresh repo and rebuild without leaving the UI
- Show current version number in header
- Enable Supervisor API access for in-app update management

## 2.1.3
- Enable Apple autofill on Ring login form for easier credential entry
- Fix Ring camera discovery (RingDevices NamedTuple access)
- Fix Ring token refresh (use async_create_session for saved tokens)

## 2.1.0
- Add Ring camera integration — discover and add Ring cameras directly
- Ring cameras stream via go2rtc's native ring:// protocol, bypassing Scrypted
- One-click add from Ring discovery panel with 2FA support
- Battery level shown for Ring devices

## 2.0.0
- Complete UI redesign with UniFi Protect/Site Manager dark theme
- Add Scrypted camera auto-discovery
- Fix s6-overlay startup crash (init: false)
- Fix HA ingress with relative asset and API paths
- Change ingress port to 8099 to avoid conflicts
- ONVIF Profile S server for UniFi Protect adoption
- go2rtc RTSP relay for stream management
- WS-Discovery for automatic camera detection in Protect
- JSON-based camera persistence across restarts
- 100% local — no cloud, no external connections

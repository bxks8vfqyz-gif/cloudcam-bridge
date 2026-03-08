# Changelog

## 2.2.0
- **Fix Ring streaming** — go2rtc ring: requires 3 params: refresh_token, camera_id (numeric), AND device_id (hardware MAC string). Now all 3 are correctly included in the stream URL.
- Discovery now captures both numeric ID and hardware device ID from Ring API

## 2.1.9
- **Fix Ring stream "wrong query" error** — go2rtc ring: requires the refresh_token in the config's ring: section, not the stream URL. Stream URLs now use ring://DEVICE_ID format.

## 2.1.8
- **Fix Ring/Scrypted black stream** — go2rtc RTSP now listens on all interfaces (0.0.0.0:8554) so UniFi Protect can actually reach it from the network
- ONVIF server now reports the real host IP in stream URLs instead of 127.0.0.1

## 2.1.7
- **Fix Ring camera black stream** — upgraded go2rtc from v1.9.4 to v1.9.14 (Ring support was added in v1.9.11)
- Improved go2rtc logging from warn to info level for better diagnostics

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

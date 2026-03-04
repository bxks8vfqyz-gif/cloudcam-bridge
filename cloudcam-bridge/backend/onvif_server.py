"""
ONVIF camera server.
One instance runs per camera on a unique port.
Implements the minimal ONVIF Profile S that UniFi Protect needs to
add a third-party camera: GetDeviceInformation, GetCapabilities,
GetProfiles, GetStreamUri, GetSnapshotUri, GetSystemDateAndTime.
Also runs a WS-Discovery UDP responder so UniFi can auto-discover it.
"""
import argparse, logging, socket, threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [ONVIF %(name)s] %(message)s")
logger = logging.getLogger(__name__)

ONVIF_NS = ('xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" '
            'xmlns:tds="http://www.onvif.org/ver10/device/wsdl" '
            'xmlns:trt="http://www.onvif.org/ver10/media/wsdl" '
            'xmlns:tt="http://www.onvif.org/ver10/schema"')

def wrap(body: str) -> str:
    return f'<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope {ONVIF_NS}><SOAP-ENV:Header/><SOAP-ENV:Body>{body}</SOAP-ENV:Body></SOAP-ENV:Envelope>'


class ONVIFHandler(BaseHTTPRequestHandler):
    # Set as class vars before starting server
    cam_name   = "Camera"
    cam_id     = "cam_001"
    rtsp_url   = "rtsp://127.0.0.1:8554/stream"
    snap_url   = ""
    width      = 1920
    height     = 1080
    framerate  = 15
    onvif_port = 9000
    username   = "admin"
    password   = "cloudcam123"
    host_ip    = "127.0.0.1"

    def log_message(self, fmt, *args):
        logger.debug(f"{self.address_string()} {fmt % args}")

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<html><body>CloudCam Bridge ONVIF Device</body></html>")

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="ignore").lower()
        resp = self._dispatch(body).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/soap+xml; charset=utf-8")
        self.send_header("Content-Length", str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

    def _dispatch(self, b: str) -> str:
        if "getdeviceinformation" in b:  return self._device_info()
        if "getcapabilities"     in b:  return self._capabilities()
        if "getnetworkinterface" in b:  return self._network()
        if "getsystemdateandtime" in b: return self._datetime()
        if "getprofiles"         in b:  return self._profiles()
        if "getstreamuri"        in b:  return self._stream_uri()
        if "getsnapshoturi"      in b:  return self._snapshot_uri()
        if "getservicecap"       in b:  return self._service_caps()
        if "getscopes"           in b:  return self._scopes()
        logger.debug(f"Unknown ONVIF action: {b[:120]}")
        return wrap('<SOAP-ENV:Fault><SOAP-ENV:Code><SOAP-ENV:Value>SOAP-ENV:Sender</SOAP-ENV:Value></SOAP-ENV:Code><SOAP-ENV:Reason><SOAP-ENV:Text xml:lang="en">ActionNotSupported</SOAP-ENV:Text></SOAP-ENV:Reason></SOAP-ENV:Fault>')

    def _device_info(self):
        return wrap(f'<tds:GetDeviceInformationResponse>'
                    f'<tds:Manufacturer>CloudCam Bridge</tds:Manufacturer>'
                    f'<tds:Model>{self.cam_name}</tds:Model>'
                    f'<tds:FirmwareVersion>2.0.0</tds:FirmwareVersion>'
                    f'<tds:SerialNumber>{self.cam_id}</tds:SerialNumber>'
                    f'<tds:HardwareId>CloudCam-2.0</tds:HardwareId>'
                    f'</tds:GetDeviceInformationResponse>')

    def _capabilities(self):
        base = f"http://{self.host_ip}:{self.onvif_port}"
        return wrap(f'<tds:GetCapabilitiesResponse><tds:Capabilities>'
                    f'<tt:Device><tt:XAddr>{base}/onvif/device_service</tt:XAddr></tt:Device>'
                    f'<tt:Media><tt:XAddr>{base}/onvif/media_service</tt:XAddr>'
                    f'<tt:StreamingCapabilities><tt:RTPMulticast>false</tt:RTPMulticast>'
                    f'<tt:RTP_TCP>true</tt:RTP_TCP><tt:RTP_RTSP_TCP>true</tt:RTP_RTSP_TCP>'
                    f'</tt:StreamingCapabilities></tt:Media>'
                    f'</tds:Capabilities></tds:GetCapabilitiesResponse>')

    def _network(self):
        return wrap(f'<tds:GetNetworkInterfacesResponse>'
                    f'<tds:NetworkInterfaces token="eth0">'
                    f'<tt:Enabled>true</tt:Enabled>'
                    f'<tt:IPv4><tt:Enabled>true</tt:Enabled>'
                    f'<tt:Config><tt:Manual><tt:Address>{self.host_ip}</tt:Address>'
                    f'<tt:PrefixLength>24</tt:PrefixLength></tt:Manual>'
                    f'<tt:DHCP>true</tt:DHCP></tt:Config></tt:IPv4>'
                    f'</tds:NetworkInterfaces></tds:GetNetworkInterfacesResponse>')

    def _datetime(self):
        n = datetime.now(timezone.utc)
        return wrap(f'<tds:GetSystemDateAndTimeResponse><tds:SystemDateAndTime>'
                    f'<tt:DateTimeType>NTP</tt:DateTimeType>'
                    f'<tt:DaylightSavings>false</tt:DaylightSavings>'
                    f'<tt:TimeZone><tt:TZ>UTC</tt:TZ></tt:TimeZone>'
                    f'<tt:UTCDateTime>'
                    f'<tt:Time><tt:Hour>{n.hour}</tt:Hour><tt:Minute>{n.minute}</tt:Minute><tt:Second>{n.second}</tt:Second></tt:Time>'
                    f'<tt:Date><tt:Year>{n.year}</tt:Year><tt:Month>{n.month}</tt:Month><tt:Day>{n.day}</tt:Day></tt:Date>'
                    f'</tt:UTCDateTime></tds:SystemDateAndTime></tds:GetSystemDateAndTimeResponse>')

    def _profiles(self):
        return wrap(f'<trt:GetProfilesResponse>'
                    f'<trt:Profiles fixed="true" token="profile_main">'
                    f'<tt:Name>{self.cam_name}</tt:Name>'
                    f'<tt:VideoSourceConfiguration token="vsc1">'
                    f'<tt:Name>VideoSource</tt:Name><tt:UseCount>1</tt:UseCount>'
                    f'<tt:SourceToken>vs1</tt:SourceToken>'
                    f'<tt:Bounds x="0" y="0" width="{self.width}" height="{self.height}"/>'
                    f'</tt:VideoSourceConfiguration>'
                    f'<tt:VideoEncoderConfiguration token="vec1">'
                    f'<tt:Name>H264</tt:Name><tt:UseCount>1</tt:UseCount>'
                    f'<tt:Encoding>H264</tt:Encoding>'
                    f'<tt:Resolution><tt:Width>{self.width}</tt:Width><tt:Height>{self.height}</tt:Height></tt:Resolution>'
                    f'<tt:Quality>6</tt:Quality>'
                    f'<tt:RateControl><tt:FrameRateLimit>{self.framerate}</tt:FrameRateLimit>'
                    f'<tt:EncodingInterval>1</tt:EncodingInterval><tt:BitrateLimit>4096</tt:BitrateLimit></tt:RateControl>'
                    f'<tt:H264><tt:GovLength>30</tt:GovLength><tt:H264Profile>High</tt:H264Profile></tt:H264>'
                    f'<tt:SessionTimeout>PT60S</tt:SessionTimeout>'
                    f'</tt:VideoEncoderConfiguration>'
                    f'</trt:Profiles></trt:GetProfilesResponse>')

    def _stream_uri(self):
        return wrap(f'<trt:GetStreamUriResponse><trt:MediaUri>'
                    f'<tt:Uri>{self.rtsp_url}</tt:Uri>'
                    f'<tt:InvalidAfterConnect>false</tt:InvalidAfterConnect>'
                    f'<tt:InvalidAfterReboot>false</tt:InvalidAfterReboot>'
                    f'<tt:Timeout>PT60S</tt:Timeout>'
                    f'</trt:MediaUri></trt:GetStreamUriResponse>')

    def _snapshot_uri(self):
        snap = self.snap_url or f"http://{self.host_ip}:1984/api/frame.jpeg?src={self.cam_id}"
        return wrap(f'<trt:GetSnapshotUriResponse><trt:MediaUri>'
                    f'<tt:Uri>{snap}</tt:Uri>'
                    f'<tt:InvalidAfterConnect>false</tt:InvalidAfterConnect>'
                    f'<tt:InvalidAfterReboot>false</tt:InvalidAfterReboot>'
                    f'<tt:Timeout>PT60S</tt:Timeout>'
                    f'</trt:MediaUri></trt:GetSnapshotUriResponse>')

    def _service_caps(self):
        return wrap('<tds:GetServiceCapabilitiesResponse><tds:Capabilities>'
                    '<tds:Network IPFilter="false" ZeroConfiguration="false" IPVersion6="false" DynDNS="false" HostnameFromDHCP="false" NTP="0"/>'
                    '<tds:Security TLS1.0="false" TLS1.1="false" TLS1.2="false" OnboardKeyGeneration="false" AccessPolicyConfig="false" DefaultAccessPolicy="false" Dot1X="false" RemoteUserHandling="false" X.509Token="false" SAMLToken="false" KerberosToken="false" UsernameToken="true" HttpDigest="false" RELToken="false"/>'
                    '</tds:Capabilities></tds:GetServiceCapabilitiesResponse>')

    def _scopes(self):
        name = self.cam_name.replace(" ", "%20")
        return wrap(f'<tds:GetScopesResponse>'
                    f'<tds:Scopes><tt:ScopeDef>Fixed</tt:ScopeDef><tt:ScopeItem>onvif://www.onvif.org/type/video_encoder</tt:ScopeItem></tds:Scopes>'
                    f'<tds:Scopes><tt:ScopeDef>Fixed</tt:ScopeDef><tt:ScopeItem>onvif://www.onvif.org/name/{name}</tt:ScopeItem></tds:Scopes>'
                    f'</tds:GetScopesResponse>')


def run_discovery(port: int, cam_name: str, cam_id: str, host_ip: str):
    """WS-Discovery multicast responder — lets UniFi Protect auto-discover the camera."""
    import struct, re
    MCAST = "239.255.255.250"
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try: sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        except AttributeError: pass
        sock.bind(("", 3702))
        mreq = struct.pack("4sL", socket.inet_aton(MCAST), socket.INADDR_ANY)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
        sock.settimeout(1.0)
        logger.info(f"WS-Discovery listening for '{cam_name}'")
        while True:
            try:
                data, addr = sock.recvfrom(4096)
                msg = data.decode("utf-8", errors="ignore")
                if "Probe" in msg:
                    mid = re.search(r"<[^>]*MessageID[^>]*>([^<]+)<", msg)
                    mid = mid.group(1) if mid else "unknown"
                    resp = f'''<?xml version="1.0"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:wsd="http://schemas.xmlsoap.org/ws/2005/04/discovery" xmlns:wsdp="http://schemas.xmlsoap.org/ws/2006/02/devprof"><SOAP-ENV:Header><wsa:MessageID>urn:uuid:{cam_id}-r</wsa:MessageID><wsa:RelatesTo>{mid}</wsa:RelatesTo><wsa:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</wsa:To><wsa:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/ProbeMatches</wsa:Action></SOAP-ENV:Header><SOAP-ENV:Body><wsd:ProbeMatches><wsd:ProbeMatch><wsa:EndpointReference><wsa:Address>uuid:{cam_id}</wsa:Address></wsa:EndpointReference><wsd:Types>wsdp:Device</wsd:Types><wsd:Scopes>onvif://www.onvif.org/name/{cam_name.replace(" ","%20")}</wsd:Scopes><wsd:XAddrs>http://{host_ip}:{port}/onvif/device_service</wsd:XAddrs><wsd:MetadataVersion>1</wsd:MetadataVersion></wsd:ProbeMatch></wsd:ProbeMatches></SOAP-ENV:Body></SOAP-ENV:Envelope>'''
                    sock.sendto(resp.encode(), addr)
            except socket.timeout:
                continue
            except Exception as e:
                logger.debug(f"Discovery error: {e}")
    except Exception as e:
        logger.warning(f"WS-Discovery failed to start: {e}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--port",      type=int, default=9000)
    p.add_argument("--name",      default="CloudCam")
    p.add_argument("--camera-id", default="cam_001")
    p.add_argument("--rtsp-url",  default="rtsp://127.0.0.1:8554/stream")
    p.add_argument("--snap-url",  default="")
    p.add_argument("--width",     type=int, default=1920)
    p.add_argument("--height",    type=int, default=1080)
    p.add_argument("--framerate", type=int, default=15)
    p.add_argument("--username",  default="admin")
    p.add_argument("--password",  default="cloudcam123")
    p.add_argument("--host",      default="0.0.0.0")
    args = p.parse_args()

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        host_ip = s.getsockname()[0]
        s.close()
    except Exception:
        host_ip = "127.0.0.1"

    ONVIFHandler.cam_name   = args.name
    ONVIFHandler.cam_id     = args.camera_id
    ONVIFHandler.rtsp_url   = args.rtsp_url
    ONVIFHandler.snap_url   = args.snap_url
    ONVIFHandler.width      = args.width
    ONVIFHandler.height     = args.height
    ONVIFHandler.framerate  = args.framerate
    ONVIFHandler.onvif_port = args.port
    ONVIFHandler.username   = args.username
    ONVIFHandler.password   = args.password
    ONVIFHandler.host_ip    = host_ip

    threading.Thread(
        target=run_discovery,
        args=(args.port, args.name, args.camera_id, host_ip),
        daemon=True
    ).start()

    server = HTTPServer((args.host, args.port), ONVIFHandler)
    logger.info(f"ONVIF '{args.name}' on port {args.port} | RTSP: {args.rtsp_url}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

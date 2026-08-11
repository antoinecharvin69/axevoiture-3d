from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

PORT = 8002
print(f"AxeVoiture 3D V16 disponible sur http://localhost:{PORT}")
print("Cache navigateur désactivé.")
ThreadingHTTPServer(("0.0.0.0", PORT), NoCacheHandler).serve_forever()

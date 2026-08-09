#!/usr/bin/env python3
import hashlib
import hmac
import json
import subprocess
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

WEBHOOK_SECRET = 'winvirahisi-deploy-secret-2026'
DEPLOY_SCRIPT = '/var/www/winvirahisi.com/deploy.sh'

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        cl = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(cl) if cl else b''
        
        if self.path == '/deploy':
            sig = self.headers.get('X-Hub-Signature-256', '')
            exp = 'sha256=' + hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
            
            try:
                with open('/var/www/winvirahisi.com/webhook_debug.txt', 'w') as f:
                    f.write(f"sig: {sig}\n")
                    f.write(f"exp: {exp}\n")
                    f.write(f"body_len: {len(body)}\n")
                    f.write(f"secret: {WEBHOOK_SECRET}\n")
                with open('/var/www/winvirahisi.com/webhook_body.bin', 'wb') as f:
                    f.write(body)
            except Exception as e:
                print(f"Failed to write debug files: {e}")
            
            if not hmac.compare_digest(sig, exp):
                self._respond(403, 'Invalid signature')
                return
                
            try:
                p = json.loads(body)
                if p.get('ref', '') != 'refs/heads/main':
                    self._respond(200, 'Ignored: not main branch')
                    return
            except Exception as e:
                self._respond(400, 'Invalid JSON payload: ' + str(e))
                return
                
            # Trigger deployment script asynchronously
            subprocess.Popen([DEPLOY_SCRIPT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self._respond(200, 'Deploy triggered')
        else:
            self._respond(404, 'Not found')

    def _respond(self, code, msg):
        self.send_response(code)
        self.send_header('Content-Type', 'text/plain')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(msg.encode())

if __name__ == "__main__":
    server = HTTPServer(('127.0.0.1', 9002), WebhookHandler)
    print('WinviRahisi Webhook listening on port 9002')
    server.serve_forever()

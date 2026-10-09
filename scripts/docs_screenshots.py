"""Regenerate the screenshots in docs/screenshots/.

Starts the backend in development mode on a throwaway SQLite file, with email (SMTP), SMS and payment settings
blanked so nothing leaves the machine, starts the Vite dev server, signs in as the built-in demo accounts and
photographs the pages in headless Chrome over the DevTools protocol. The data is the demo data the backend seeds
on startup.

Needs: run it with a Python that has the backend's packages (pip install -r backend/requirements.txt), node_modules (npm install), google-chrome or
chromium, and `pip install websocket-client`. Ports 8000 and 3000 must be free (in development the frontend
calls the API on port 8000 of the same host).

    python scripts/docs_screenshots.py
"""

from __future__ import annotations

import base64
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

import websocket

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "screenshots"
API = "http://127.0.0.1:8000"
WEB = "http://127.0.0.1:3000"

SAFE_ENV = {
    "DEBUG": "true",  # enables the demo sign-in (mock-sso)
    "JWT_SECRET_KEY": "docs-screenshots-only-secret-key-0123456789",
    "SMTP_USERNAME": "", "SMTP_PASSWORD": "", "SMTP_SERVER": "127.0.0.1", "SMTP_PORT": "9", "FROM_EMAIL": "",
    "ADVANTA_SMS_API_KEY": "", "ADVANTA_SMS_PARTNER_ID": "",
    "MPESA_CONSUMER_KEY": "", "MPESA_CONSUMER_SECRET": "", "PAYPAL_CLIENT_ID": "", "PAYPAL_CLIENT_SECRET": "",
    "PAYSTACK_SECRET_KEY": "", "PAYSTACK_PUBLIC_KEY": "",
    "ALLOWED_ORIGINS": WEB,
    "FRONTEND_URL": WEB,
    "BACKEND_URL": API,
}

STUDENT = {
    "email": "emily.wanjiru@student.uonbi.ac.ke", "name": "Emily Wanjiru Kamau", "role": "student",
    "reg_number": "F17/141029/2022", "campus": "Main Campus", "faculty": "Faculty of Science & Technology",
    "department": "Department of Computer Science", "course": "B.Sc. Computer Science",
    "year_of_study": "Year 3", "semester": "Semester 2",
}
LECTURER = {"email": "peter.otieno@uonbi.ac.ke", "name": "Dr. Peter Otieno", "role": "lecturer"}
ADMIN = {"email": "kaleb.wambua@uonbi.ac.ke", "name": "Prof. Kaleb Wambua", "role": "admin"}


def port_busy(port: int) -> bool:
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def wait_http(url: str, timeout: float = 90) -> None:
    end = time.time() + timeout
    while time.time() < end:
        try:
            urllib.request.urlopen(url, timeout=2)
            return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f"{url} did not come up")


class Chrome:
    def __init__(self, width: int, height: int, mobile: bool = False) -> None:
        exe = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
        if not exe:
            raise SystemExit("google-chrome or chromium is required")
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            self.port = s.getsockname()[1]
        self.profile = tempfile.mkdtemp(prefix="sa-chrome-")
        self.proc = subprocess.Popen(
            [exe, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
             f"--remote-debugging-port={self.port}", f"--user-data-dir={self.profile}",
             f"--window-size={width},{height}", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_http(f"http://127.0.0.1:{self.port}/json/version")
        tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{self.port}/json"))
        page = next(t for t in tabs if t["type"] == "page")
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=60, suppress_origin=True)
        self.n = 0
        self.call("Page.enable")
        self.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
                  deviceScaleFactor=2 if mobile else 1, mobile=mobile)

    def call(self, method: str, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def js(self, expr: str):
        res = self.call("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
        return res.get("result", {}).get("value")

    def goto(self, url: str, settle: float = 4.0) -> None:
        self.call("Page.navigate", url=url)
        for _ in range(150):
            if self.js("document.readyState") == "complete":
                break
            time.sleep(0.1)
        time.sleep(settle)

    def sign_in(self, account: dict) -> None:
        """Demo sign-in (development only), the same call the login page's demo buttons make."""
        self.goto(WEB + "/login", 2)
        status = self.js(f"""fetch({json.dumps(API + '/api/auth/mock-sso')}, {{
            method: 'POST', credentials: 'include', headers: {{'Content-Type': 'application/json'}},
            body: {json.dumps(json.dumps(account))}
        }}).then(r => r.status)""")
        if status != 200:
            raise RuntimeError(f"demo sign-in for {account['email']} failed: HTTP {status}")

    def click_text(self, text: str, settle: float = 2.5) -> None:
        found = self.js(f"""(() => {{
            const el = [...document.querySelectorAll('button, a, [role=button]')]
                .find(e => e.textContent.trim().includes({json.dumps(text)}) && e.offsetParent);
            if (el) el.click();
            return !!el;
        }})()""")
        if not found:
            raise RuntimeError(f"no visible button or link containing {text!r}")
        time.sleep(settle)

    def shot(self, name: str) -> None:
        data = self.call("Page.captureScreenshot", format="png")["data"]
        (OUT / f"{name}.png").write_bytes(base64.b64decode(data))
        print(f"wrote docs/screenshots/{name}.png")

    def close(self) -> None:
        self.ws.close()
        self.proc.terminate()
        self.proc.wait(timeout=10)
        shutil.rmtree(self.profile, ignore_errors=True)


def capture() -> None:
    c = Chrome(1440, 900)
    c.goto(WEB + "/", 5)
    # Development builds add a demo-accounts panel to the sign-in page; production doesn't, so remove it
    c.js("""(() => {
        const label = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Demo & Testing Accounts'));
        if (label) label.parentElement.remove();
    })()""")
    c.shot("sign-in")
    c.sign_in(STUDENT)
    c.goto(WEB + "/")
    c.shot("student-portal")
    c.click_text("New Claim Ticket")
    c.js("""(() => {
        const h = [...document.querySelectorAll('h1, h2, h3, h4, span, div')]
            .find(e => e.textContent.trim() === 'File a Missing / Disputed Mark');
        if (h) h.scrollIntoView({block: 'start'});
        window.scrollBy(0, -24);
    })()""")
    import time as _t; _t.sleep(1)
    c.shot("new-claim")
    c.goto(WEB + "/clearance/ticket/UON-1039")
    c.shot("ticket-detail")
    c.close()

    c = Chrome(1440, 900)
    c.sign_in(LECTURER)
    c.goto(WEB + "/")
    c.shot("lecturer-portal")
    c.close()

    c = Chrome(1440, 900)
    c.sign_in(ADMIN)
    c.goto(WEB + "/")
    c.shot("admin-portal")
    c.close()

    phone = Chrome(390, 844, mobile=True)
    phone.sign_in(STUDENT)
    phone.goto(WEB + "/")
    phone.shot("mobile-student-portal")
    phone.close()


def main() -> int:
    for port in (8000, 3000):
        if port_busy(port):
            raise SystemExit(f"port {port} is in use; stop the dev servers first")
    OUT.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="sa-docs-"))
    env = {**os.environ, **SAFE_ENV, "DATABASE_URL": f"sqlite+aiosqlite:///{work / 'demo.db'}"}
    backend = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app",
                                "--host", "127.0.0.1", "--port", "8000"],
                               cwd=work, env={**env, "PYTHONPATH": str(ROOT / "backend")},
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frontend = subprocess.Popen([str(ROOT / "node_modules/.bin/vite"), "--port", "3000", "--strictPort",
                                 "--host", "127.0.0.1"], cwd=ROOT, env={**os.environ, "VITE_API_URL": API},
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        wait_http(API + "/api/health")
        wait_http(WEB + "/")
        capture()
    finally:
        for proc in (frontend, backend):
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
        shutil.rmtree(work, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

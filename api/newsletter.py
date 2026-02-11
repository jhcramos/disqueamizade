import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


def supabase_request(method, path, data=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode() if resp.status != 201 else ''
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length)) if content_length > 0 else {}

        action = body.get('action', 'subscribe')
        email = body.get('email', '').strip().lower()

        if not email or '@' not in email:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Email inválido"}).encode())
            return

        if action == 'subscribe':
            name = body.get('name', '')
            source = body.get('source', 'website')
            status, resp = supabase_request('POST', 'newsletter_subscribers', {
                'email': email,
                'name': name,
                'source': source,
                'active': True,
            })

            if status in (200, 201):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "message": "Inscrito com sucesso! 🎉"}).encode())
            elif 'duplicate' in resp.lower() or '23505' in resp:
                # Already subscribed — reactivate
                supabase_request('PATCH', f'newsletter_subscribers?email=eq.{email}', {
                    'active': True, 'unsubscribed_at': None
                })
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "message": "Reativado! Bem-vindo(a) de volta! 🎺"}).encode())
            else:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Erro ao inscrever", "detail": resp}).encode())

        elif action == 'unsubscribe':
            status, _ = supabase_request('PATCH', f'newsletter_subscribers?email=eq.{email}', {
                'active': False, 'unsubscribed_at': 'now()'
            })
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "message": "Descadastrado. Sentiremos sua falta! 😢"}).encode())

        else:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Ação inválida"}).encode())

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status":"ok","endpoint":"newsletter"}')

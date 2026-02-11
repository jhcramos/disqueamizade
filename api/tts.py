import edge_tts
import asyncio
import json
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length))

        text = body.get('text', '')
        rate = body.get('rate', '+0%')
        pitch = body.get('pitch', '+0Hz')
        volume = body.get('volume', '+0%')

        if not text or len(text) > 500:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error":"text required, max 500 chars"}')
            return

        voice = body.get('voice', "pt-BR-AntonioNeural")

        async def generate():
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume)
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            return audio_data

        try:
            audio = asyncio.run(generate())
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            self.wfile.write(audio)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status":"ok","voice":"pt-BR-AntonioNeural"}')

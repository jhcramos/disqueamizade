import edge_tts
import asyncio
import json
import re
from http.server import BaseHTTPRequestHandler


def text_to_ssml(text: str, rate: str, pitch: str, volume: str, use_ssml: bool = False) -> str:
    """Convert plain text to expressive SSML with pauses and emphasis."""
    if not use_ssml:
        return text

    # Add dramatic pauses after punctuation
    ssml = text
    # Pause after "!" (excitement)
    ssml = re.sub(r'!\s*', '! <break time="400ms"/> ', ssml)
    # Pause after "..." (suspense)
    ssml = re.sub(r'\.{2,}\s*', ' <break time="600ms"/> ', ssml)
    # Pause after "?" (anticipation)
    ssml = re.sub(r'\?\s*', '? <break time="350ms"/> ', ssml)
    # Pause after ":" (revelation)
    ssml = re.sub(r':\s*', ': <break time="300ms"/> ', ssml)

    # Emphasize UPPERCASE words (3+ chars, not the whole text)
    def emphasize_caps(match):
        word = match.group(0)
        return f'<emphasis level="strong">{word.title()}</emphasis>'
    ssml = re.sub(r'\b[A-ZÀ-Ú]{3,}\b', emphasize_caps, ssml)

    # Wrap in SSML prosody
    ssml = f'<speak><prosody rate="{rate}" pitch="{pitch}" volume="{volume}">{ssml}</prosody></speak>'
    return ssml


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length))

        text = body.get('text', '')
        rate = body.get('rate', '+0%')
        pitch = body.get('pitch', '+0Hz')
        volume = body.get('volume', '+0%')
        use_ssml = body.get('ssml', False)

        if not text or len(text) > 500:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error":"text required, max 500 chars"}')
            return

        voice = body.get('voice', "pt-BR-AntonioNeural")

        # Add natural pauses via text manipulation (NOT SSML tags — Edge TTS reads them literally)
        speech_text = text
        if use_ssml:
            # Insert natural pause words instead of SSML tags
            speech_text = re.sub(r'!\s*', '!... ', speech_text)
            speech_text = re.sub(r'\?\s*', '?... ', speech_text)
            speech_text = re.sub(r'\.{2,}\s*', '...... ', speech_text)
            # Don't wrap in XML tags — Edge TTS doesn't support SSML

        async def generate():
            communicate = edge_tts.Communicate(speech_text, voice, rate=rate, pitch=pitch, volume=volume)
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
        self.wfile.write(b'{"status":"ok","voice":"pt-BR-AntonioNeural","ssml":true}')

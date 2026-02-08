export default async function handler(req: any, res: any) {
  // Simple page that tests WebRTC between two browser tabs
  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html>
<html><head><title>WebRTC Debug</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>body{background:#111;color:#fff;font-family:monospace;padding:20px}video{width:300px;border:2px solid #333;border-radius:8px;margin:5px}#log{background:#000;padding:10px;max-height:300px;overflow-y:auto;font-size:12px;border-radius:8px;margin-top:10px}.ok{color:#0f0}.err{color:#f00}.info{color:#0ff}</style>
</head><body>
<h2>🔧 WebRTC Debug</h2>
<div>
  <button onclick="start()" id="btn" style="padding:10px 20px;font-size:16px;background:#7c3aed;color:white;border:none;border-radius:8px;cursor:pointer">Ligar Câmera e Conectar</button>
  <span id="status" style="margin-left:10px"></span>
</div>
<div style="display:flex;gap:10px;margin-top:10px">
  <div><p>Você</p><video id="local" autoplay playsinline muted></video></div>
  <div><p>Remoto</p><video id="remote" autoplay playsinline></video></div>
</div>
<div id="log"></div>
<script>
const ROOM = 'debug-test-room';
const USER_ID = 'user-' + Math.random().toString(36).slice(2,8);
const sb = supabase.createClient(
  'https://uquztttljpswheiikbkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdXp0dHRsanBzd2hlaWlrYmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MTEzNzAsImV4cCI6MjA4NjA4NzM3MH0.HkTw7H6I2WvP5bhETLGms4PPTuADr8GdiXQ3UJRjUN0'
);

function log(msg, cls='info') {
  const d = document.getElementById('log');
  d.innerHTML += '<div class="'+cls+'">[' + new Date().toLocaleTimeString() + '] ' + msg + '</div>';
  d.scrollTop = d.scrollHeight;
}

let pc = null;
let localStream = null;
let channel = null;

async function start() {
  document.getElementById('btn').disabled = true;
  document.getElementById('status').textContent = 'Conectando...';
  log('User ID: ' + USER_ID);
  
  // Get camera
  try {
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
    document.getElementById('local').srcObject = localStream;
    log('Camera OK', 'ok');
  } catch(e) {
    log('Camera error: ' + e.message, 'err');
    return;
  }

  // Join Supabase Realtime
  channel = sb.channel('webrtc:' + ROOM, { config: { presence: { key: USER_ID } } });

  channel
    .on('broadcast', { event: 'signal' }, ({payload}) => {
      if (payload.to !== USER_ID) return;
      log('Signal from ' + payload.from.slice(0,8) + ': ' + payload.data.type);
      handleSignal(payload.from, payload.data);
    })
    .on('presence', { event: 'join' }, ({newPresences}) => {
      for (const p of newPresences) {
        const pid = p.user_id;
        if (pid && pid !== USER_ID) {
          log('Peer joined: ' + pid.slice(0,8), 'ok');
          createPC(pid);
        }
      }
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const peers = Object.keys(state).filter(k => k !== USER_ID);
      log('Sync: ' + Object.keys(state).length + ' users, ' + peers.length + ' peers');
      document.getElementById('status').textContent = Object.keys(state).length + ' users in room';
      for (const pid of peers) {
        if (!pc) createPC(pid);
      }
    })
    .subscribe(async (status) => {
      log('Channel: ' + status, status === 'SUBSCRIBED' ? 'ok' : 'info');
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: USER_ID, joined_at: Date.now() });
        log('Tracked presence', 'ok');
      }
    });
}

function createPC(peerId) {
  if (pc) return;
  log('Creating PeerConnection for ' + peerId.slice(0,8));
  
  const polite = USER_ID > peerId;
  let makingOffer = false;
  
  pc = new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  log('Added ' + localStream.getTracks().length + ' tracks');
  
  pc.ontrack = (e) => {
    log('GOT REMOTE TRACK: ' + e.track.kind, 'ok');
    document.getElementById('remote').srcObject = e.streams[0];
  };
  
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      channel.send({type:'broadcast',event:'signal',payload:{from:USER_ID,to:peerId,data:{type:'candidate',candidate:e.candidate.toJSON()}}});
    }
  };
  
  pc.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      await pc.setLocalDescription();
      log('Sending offer to ' + peerId.slice(0,8));
      channel.send({type:'broadcast',event:'signal',payload:{from:USER_ID,to:peerId,data:{type:'offer',sdp:pc.localDescription.toJSON()}}});
    } catch(e) { log('Offer error: '+e.message,'err'); }
    finally { makingOffer = false; }
  };
  
  pc.onconnectionstatechange = () => log('Connection: ' + pc.connectionState, pc.connectionState==='connected'?'ok':'info');
  pc.oniceconnectionstatechange = () => log('ICE: ' + pc.iceConnectionState);
  
  pc._handleSignal = async (data) => {
    try {
      if (data.type === 'offer') {
        const collision = makingOffer || pc.signalingState !== 'stable';
        if (!polite && collision) { log('Ignoring colliding offer'); return; }
        await pc.setRemoteDescription(data.sdp);
        await pc.setLocalDescription();
        log('Sending answer to ' + peerId.slice(0,8));
        channel.send({type:'broadcast',event:'signal',payload:{from:USER_ID,to:peerId,data:{type:'answer',sdp:pc.localDescription.toJSON()}}});
      } else if (data.type === 'answer') {
        await pc.setRemoteDescription(data.sdp);
        log('Got answer', 'ok');
      } else if (data.type === 'candidate') {
        await pc.addIceCandidate(data.candidate);
      }
    } catch(e) { log('Signal error: '+e.message,'err'); }
  };
}

function handleSignal(from, data) {
  if (!pc) createPC(from);
  if (pc._handleSignal) pc._handleSignal(data);
}
</script>
</body></html>`)
}

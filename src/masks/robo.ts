// Robô — placa facial metálica com visor. Os LEDs dos olhos apagam quando
// você pisca e a grade da boca acende quando você fala.
import { createSpriteMask, smoothstep } from './sprite'

const DEFS = `
<linearGradient id="rbMetal" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#6b7280"/><stop offset=".35" stop-color="#374151"/><stop offset="1" stop-color="#111827"/>
</linearGradient>
<linearGradient id="rbSheen" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="rbVisor" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#020617"/>
</linearGradient>
<filter id="rbGlow" x="-100%" y="-100%" width="300%" height="300%">
  <feGaussianBlur stdDeviation="14"/>
</filter>
<filter id="rbShadow" x="-20%" y="-20%" width="140%" height="140%">
  <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000" flood-opacity=".5"/>
</filter>
`

const PLATE = `M 262 170 L 738 170 Q 806 170 806 238 L 806 704 Q 806 796 726 834 L 562 904 Q 500 922 438 904 L 274 834 Q 194 796 194 704 L 194 238 Q 194 170 262 170 Z`

const BASE = `
<g filter="url(#rbShadow)">
  <!-- antena -->
  <rect x="490" y="70" width="20" height="110" rx="6" fill="#4b5563" stroke="#111827" stroke-width="4"/>
  <circle cx="500" cy="62" r="24" fill="#ef4444" stroke="#7f1d1d" stroke-width="4"/>
  <circle cx="492" cy="54" r="7" fill="#fff" opacity=".7"/>
  <!-- pods laterais -->
  <circle cx="208" cy="450" r="54" fill="#374151" stroke="#111827" stroke-width="6"/>
  <circle cx="792" cy="450" r="54" fill="#374151" stroke="#111827" stroke-width="6"/>
  <circle cx="208" cy="450" r="22" fill="#0b1020" stroke="#22d3ee" stroke-width="4"/>
  <circle cx="792" cy="450" r="22" fill="#0b1020" stroke="#22d3ee" stroke-width="4"/>
  <!-- placa -->
  <path d="${PLATE}" fill="url(#rbMetal)" stroke="#0b0f1a" stroke-width="8" stroke-linejoin="round"/>
  <path d="${PLATE}" fill="url(#rbSheen)"/>
  <!-- juntas -->
  <g stroke="#0b0f1a" stroke-width="5" fill="none" stroke-linecap="round">
    <path d="M 500 176 L 500 330"/>
    <path d="M 500 520 L 500 630"/>
    <path d="M 208 560 L 792 560"/>
    <path d="M 300 176 L 300 330 M 700 176 L 700 330"/>
    <path d="M 260 620 L 380 620 M 620 620 L 740 620"/>
  </g>
  <!-- rebites -->
  <g fill="#9ca3af" stroke="#111827" stroke-width="3">
    ${[[250,220],[750,220],[250,530],[750,530],[300,780],[700,780],[440,860],[560,860]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join('')}
  </g>
  <!-- visor -->
  <rect x="252" y="346" width="496" height="150" rx="46" fill="url(#rbVisor)" stroke="#22d3ee" stroke-width="7"/>
  <rect x="266" y="358" width="468" height="26" rx="13" fill="#fff" opacity=".08"/>
  <!-- anéis dos LEDs (apagados) -->
  <circle cx="383" cy="422" r="44" fill="#06121a" stroke="#155e75" stroke-width="5"/>
  <circle cx="617" cy="422" r="44" fill="#06121a" stroke="#155e75" stroke-width="5"/>
  <!-- ventilação das bochechas -->
  <g fill="#0b0f1a">
    ${[0,1,2,3].map((i) => `<rect x="236" y="${660 + i * 22}" width="70" height="10" rx="5"/><rect x="694" y="${660 + i * 22}" width="70" height="10" rx="5"/>`).join('')}
  </g>
  <!-- grade da boca -->
  <rect x="402" y="652" width="196" height="96" rx="20" fill="#0b0f1a" stroke="#4b5563" stroke-width="6"/>
  <g fill="#1f2937">
    ${[0,1,2,3,4].map((i) => `<rect x="420" y="${668 + i * 15}" width="160" height="8" rx="4"/>`).join('')}
  </g>
</g>`

const led = (cx: number) => `
<circle cx="${cx}" cy="422" r="44" fill="#22d3ee" filter="url(#rbGlow)" opacity=".9"/>
<circle cx="${cx}" cy="422" r="36" fill="#67e8f9"/>
<circle cx="${cx}" cy="422" r="18" fill="#ffffff"/>`

const MOUTH_GLOW = `
<g fill="#f59e0b">
  ${[0,1,2,3,4].map((i) => `<rect x="420" y="${668 + i * 15}" width="160" height="8" rx="4" filter="url(#rbGlow)"/>`).join('')}
  ${[0,1,2,3,4].map((i) => `<rect x="420" y="${668 + i * 15}" width="160" height="8" rx="4" fill="#fbbf24"/>`).join('')}
</g>`

export const robo = createSpriteMask({
  id: 'robo',
  name: 'Robô',
  icon: '🤖',
  description: 'Visor com LEDs que piscam com você',
  defs: DEFS,
  layers: [
    { svg: BASE },
    { svg: led(617), opacity: (p) => 1 - smoothstep(p.blinkL, 0.5, 0.8) },
    { svg: led(383), opacity: (p) => 1 - smoothstep(p.blinkR, 0.5, 0.8) },
    { svg: MOUTH_GLOW, opacity: (p) => smoothstep(p.mouthOpen, 0.1, 0.4) },
  ],
})

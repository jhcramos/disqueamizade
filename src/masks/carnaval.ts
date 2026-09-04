// Carnaval — máscara veneziana/colombina em roxo, dourado e verde, com plumas.
// Cobre sobrancelhas → maçãs do rosto, com aberturas nos olhos.
import { createSpriteMask } from './sprite'

const DEFS = `
<linearGradient id="cPurple" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#a78bfa"/><stop offset=".45" stop-color="#7c3aed"/><stop offset="1" stop-color="#4c1d95"/>
</linearGradient>
<linearGradient id="cGold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#f59e0b"/><stop offset="1" stop-color="#92400e"/>
</linearGradient>
<linearGradient id="cGreen" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#6ee7b7"/><stop offset="1" stop-color="#047857"/>
</linearGradient>
<mask id="cHoles">
  <rect width="1000" height="1000" fill="#fff"/>
  <ellipse cx="617" cy="422" rx="74" ry="48" fill="#000"/>
  <ellipse cx="383" cy="422" rx="74" ry="48" fill="#000"/>
</mask>
<filter id="cShadow" x="-20%" y="-20%" width="140%" height="140%">
  <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000" flood-opacity=".5"/>
</filter>
<filter id="cGlow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="6"/>
</filter>
`

// pluma: folha alongada com nervura, apontando para cima (origem na base)
const feather = (x: number, y: number, rot: number, fill: string, len = 330) => `
<g transform="translate(${x} ${y}) rotate(${rot})">
  <path d="M0 0 C 46 -${len * 0.25}, 44 -${len * 0.7}, 0 -${len} C -44 -${len * 0.7}, -46 -${len * 0.25}, 0 0 Z" fill="${fill}" opacity=".95"/>
  <path d="M0 -12 L0 -${len - 20}" stroke="#fff" stroke-opacity=".55" stroke-width="4"/>
  ${Array.from({ length: 9 }, (_, i) => { const yy = -40 - i * ((len - 70) / 9); const w = 26 - i * 1.6; return `<path d="M0 ${yy} L ${w} ${yy - 22} M0 ${yy} L ${-w} ${yy - 22}" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>` }).join('')}
</g>`

const BODY = `M 500 352 C 560 316, 650 292, 730 282 C 762 278, 792 256, 802 236 C 818 300, 792 372, 742 424 C 690 476, 612 500, 500 494 C 388 500, 310 476, 258 424 C 208 372, 182 300, 198 236 C 208 256, 238 278, 270 282 C 350 292, 440 316, 500 352 Z`

const BASE = `
<!-- plumas (atrás da máscara) -->
${feather(700, 300, 18, 'url(#cPurple)', 360)}
${feather(745, 292, 42, 'url(#cGreen)', 300)}
${feather(660, 296, -6, 'url(#cGold)', 300)}
${feather(300, 300, -18, 'url(#cPurple)', 300)}
${feather(255, 292, -42, 'url(#cGreen)', 250)}

<g filter="url(#cShadow)">
  <g mask="url(#cHoles)">
    <path d="${BODY}" fill="url(#cPurple)"/>
    <!-- brilho de cetim -->
    <path d="M 300 330 C 400 300, 600 300, 700 330 C 640 360, 360 360, 300 330 Z" fill="#fff" opacity=".14"/>
    <!-- filigrana dourada -->
    <g fill="none" stroke="url(#cGold)" stroke-width="7" stroke-linecap="round">
      <path d="M 500 372 C 470 372, 455 400, 470 430 C 485 460, 515 460, 530 430 C 545 400, 530 372, 500 372"/>
      <path d="M 262 300 C 300 330, 300 400, 270 420"/>
      <path d="M 738 300 C 700 330, 700 400, 730 420"/>
      <path d="M 330 470 C 360 485, 420 486, 460 476"/>
      <path d="M 670 470 C 640 485, 580 486, 540 476"/>
    </g>
    <!-- glitter -->
    <g fill="#fff">
      ${[[290,360],[340,320],[420,330],[580,330],[660,320],[710,360],[520,470],[480,470],[350,440],[650,440]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3.5" opacity=".9"/>`).join('')}
    </g>
  </g>
  <!-- contorno dourado -->
  <path d="${BODY}" fill="none" stroke="url(#cGold)" stroke-width="10" stroke-linejoin="round"/>
  <!-- aros dourados dos olhos -->
  <ellipse cx="617" cy="422" rx="82" ry="56" fill="none" stroke="url(#cGold)" stroke-width="12"/>
  <ellipse cx="383" cy="422" rx="82" ry="56" fill="none" stroke="url(#cGold)" stroke-width="12"/>
  <!-- gema central -->
  <g transform="translate(500 350)">
    <polygon points="0,-34 30,0 0,34 -30,0" fill="#f472b6" stroke="url(#cGold)" stroke-width="6"/>
    <polygon points="0,-18 12,0 0,18 -12,0" fill="#fff" opacity=".55"/>
  </g>
  <!-- gemas laterais -->
  <circle cx="300" cy="392" r="14" fill="#34d399" stroke="url(#cGold)" stroke-width="5"/>
  <circle cx="700" cy="392" r="14" fill="#34d399" stroke="url(#cGold)" stroke-width="5"/>
</g>`

export const carnaval = createSpriteMask({
  id: 'carnaval',
  name: 'Carnaval',
  icon: '🎭',
  description: 'Veneziana com plumas',
  defs: DEFS,
  layers: [{ svg: BASE }],
})

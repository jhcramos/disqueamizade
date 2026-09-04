// Raposa — cabeça inteira (cobre o rosto todo). A boca abre quando você fala
// e os olhos piscam junto com os seus.
import { createSpriteMask, smoothstep } from './sprite'

const DEFS = `
<radialGradient id="fxFur" cx=".5" cy=".38" r=".7">
  <stop offset="0" stop-color="#fdba74"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#c2410c"/>
</radialGradient>
<linearGradient id="fxWhite" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e5e7eb"/>
</linearGradient>
<radialGradient id="fxIris" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#fcd34d"/><stop offset=".7" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/>
</radialGradient>
<filter id="fxShadow" x="-20%" y="-20%" width="140%" height="140%">
  <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".45"/>
</filter>
`

const eye = (cx: number) => `
<g>
  <ellipse cx="${cx}" cy="420" rx="66" ry="44" fill="#fff8e7" stroke="#2a1508" stroke-width="7"/>
  <circle cx="${cx}" cy="422" r="31" fill="url(#fxIris)"/>
  <ellipse cx="${cx}" cy="422" rx="9" ry="27" fill="#0b0704"/>
  <circle cx="${cx - 11}" cy="408" r="8" fill="#fff" opacity=".9"/>
</g>`

const BASE = `
<g filter="url(#fxShadow)">
  <!-- orelhas -->
  <path d="M 268 262 C 236 160, 228 90, 248 28 C 332 66, 404 140, 450 218 Z" fill="url(#fxFur)" stroke="#7c2d12" stroke-width="6" stroke-linejoin="round"/>
  <path d="M 732 262 C 764 160, 772 90, 752 28 C 668 66, 596 140, 550 218 Z" fill="url(#fxFur)" stroke="#7c2d12" stroke-width="6" stroke-linejoin="round"/>
  <path d="M 292 246 C 276 176, 274 124, 286 78 C 340 112, 388 168, 420 222 Z" fill="#3b1a0a"/>
  <path d="M 708 246 C 724 176, 726 124, 714 78 C 660 112, 612 168, 580 222 Z" fill="#3b1a0a"/>
  <path d="M 300 236 C 290 186, 292 146, 300 112 C 336 140, 366 178, 392 218 Z" fill="#fda4af" opacity=".8"/>
  <path d="M 700 236 C 710 186, 708 146, 700 112 C 664 140, 634 178, 608 218 Z" fill="#fda4af" opacity=".8"/>
  <!-- cabeça -->
  <ellipse cx="500" cy="520" rx="332" ry="400" fill="url(#fxFur)" stroke="#7c2d12" stroke-width="6"/>
  <!-- bochechas peludas -->
  <path d="M 178 560 C 200 690, 300 740, 400 700 C 360 640, 300 590, 178 560 Z" fill="url(#fxWhite)"/>
  <path d="M 822 560 C 800 690, 700 740, 600 700 C 640 640, 700 590, 822 560 Z" fill="url(#fxWhite)"/>
  <!-- focinho -->
  <path d="M 322 556 C 326 700, 400 838, 500 846 C 600 838, 674 700, 678 556 C 630 612, 370 612, 322 556 Z" fill="url(#fxWhite)"/>
  <!-- marcas escuras dos olhos -->
  <path d="M 300 372 C 340 330, 430 340, 470 400 C 430 372, 350 380, 300 372 Z" fill="#7c2d12" opacity=".55"/>
  <path d="M 700 372 C 660 330, 570 340, 530 400 C 570 372, 650 380, 700 372 Z" fill="#7c2d12" opacity=".55"/>
  <!-- olhos -->
  ${eye(383)}
  ${eye(617)}
  <!-- nariz e boca fechada -->
  <ellipse cx="500" cy="614" rx="44" ry="32" fill="#1c0f08"/>
  <ellipse cx="486" cy="602" rx="12" ry="7" fill="#fff" opacity=".5"/>
  <path d="M 500 646 L 500 690" stroke="#3b1a0a" stroke-width="8" stroke-linecap="round"/>
  <path d="M 436 690 Q 500 748 564 690" fill="none" stroke="#3b1a0a" stroke-width="8" stroke-linecap="round"/>
  <!-- bigodes -->
  <g stroke="#fff" stroke-opacity=".8" stroke-width="4" stroke-linecap="round">
    <path d="M 420 640 L 250 610 M 420 665 L 240 665 M 420 690 L 260 720"/>
    <path d="M 580 640 L 750 610 M 580 665 L 760 665 M 580 690 L 740 720"/>
  </g>
</g>`

const MOUTH_OPEN = `
<path d="M 430 688 Q 500 690 570 688 Q 574 790 500 812 Q 426 790 430 688 Z" fill="#5c0f0f" stroke="#3b1a0a" stroke-width="6"/>
<ellipse cx="500" cy="780" rx="40" ry="26" fill="#f472b6"/>
<path d="M 452 692 L 466 722 L 480 692 Z M 520 692 L 534 722 L 548 692 Z" fill="#fff"/>`

const blink = (cx: number) => `
<ellipse cx="${cx}" cy="420" rx="70" ry="48" fill="#f97316"/>
<path d="M ${cx - 62} 424 Q ${cx} 464 ${cx + 62} 424" fill="none" stroke="#2a1508" stroke-width="8" stroke-linecap="round"/>`

export const raposa = createSpriteMask({
  id: 'raposa',
  name: 'Raposa',
  icon: '🦊',
  description: 'Cabeça inteira; a boca abre com a sua',
  defs: DEFS,
  layers: [
    { svg: BASE },
    { svg: MOUTH_OPEN, opacity: (p) => smoothstep(p.mouthOpen, 0.12, 0.4) },
    { svg: blink(617), opacity: (p) => smoothstep(p.blinkL, 0.5, 0.8) },
    { svg: blink(383), opacity: (p) => smoothstep(p.blinkR, 0.5, 0.8) },
  ],
})

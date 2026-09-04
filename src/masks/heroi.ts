// Herói — máscara de luchador/super-herói: cabeça inteira em vermelho e
// dourado. Olhos com lente escura (anonimato) e boca livre (a sua aparece).
import { createSpriteMask } from './sprite'

const DEFS = `
<radialGradient id="hrRed" cx=".42" cy=".3" r=".8">
  <stop offset="0" stop-color="#f87171"/><stop offset=".45" stop-color="#dc2626"/><stop offset="1" stop-color="#7f1d1d"/>
</radialGradient>
<linearGradient id="hrGold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fef3c7"/><stop offset=".45" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/>
</linearGradient>
<mask id="hrMouth">
  <rect width="1000" height="1000" fill="#fff"/>
  <ellipse cx="500" cy="702" rx="86" ry="50" fill="#000"/>
</mask>
<filter id="hrShadow" x="-20%" y="-20%" width="140%" height="140%">
  <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".5"/>
</filter>
`

const flame = (mirror: boolean) => {
  const d = `M 352 396 C 322 340, 372 300, 344 214 C 404 262, 388 322, 428 372 C 400 330, 436 300, 426 246 C 470 300, 442 356, 470 400 Z`
  return mirror ? `<path d="${d}" fill="url(#hrGold)" transform="translate(1000 0) scale(-1 1)"/>` : `<path d="${d}" fill="url(#hrGold)"/>`
}

const BASE = `
<g filter="url(#hrShadow)">
  <g mask="url(#hrMouth)">
    <ellipse cx="500" cy="508" rx="304" ry="384" fill="url(#hrRed)"/>
    <!-- costura central -->
    <path d="M 500 128 L 500 340" stroke="#7f1d1d" stroke-width="6" stroke-dasharray="12 10"/>
    <!-- brilho do tecido -->
    <ellipse cx="420" cy="300" rx="130" ry="90" fill="#fff" opacity=".10"/>
    <!-- chamas douradas -->
    ${flame(false)}
    ${flame(true)}
    <!-- estrela da testa -->
    <g transform="translate(500 262)">
      <polygon points="0,-54 16,-18 54,-18 24,6 34,44 0,22 -34,44 -24,6 -54,-18 -16,-18" fill="url(#hrGold)" stroke="#92400e" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="0,-28 8,-10 28,-10 12,3 18,22 0,11 -18,22 -12,3 -28,-10 -8,-10" fill="#fff" opacity=".35"/>
    </g>
    <!-- nariz de tecido -->
    <ellipse cx="500" cy="590" rx="46" ry="34" fill="#000" opacity=".14"/>
    <!-- lentes dos olhos -->
    <ellipse cx="383" cy="422" rx="80" ry="54" fill="#050509" opacity=".62"/>
    <ellipse cx="617" cy="422" rx="80" ry="54" fill="#050509" opacity=".62"/>
    <ellipse cx="368" cy="404" rx="30" ry="12" fill="#fff" opacity=".18" transform="rotate(-18 368 404)"/>
    <ellipse cx="602" cy="404" rx="30" ry="12" fill="#fff" opacity=".18" transform="rotate(-18 602 404)"/>
    <!-- queixo dourado -->
    <path d="M 340 800 Q 500 900 660 800 Q 500 860 340 800 Z" fill="url(#hrGold)" opacity=".9"/>
  </g>
  <!-- contorno e aros dourados -->
  <ellipse cx="500" cy="508" rx="304" ry="384" fill="none" stroke="url(#hrGold)" stroke-width="12"/>
  <ellipse cx="383" cy="422" rx="86" ry="60" fill="none" stroke="url(#hrGold)" stroke-width="13"/>
  <ellipse cx="617" cy="422" rx="86" ry="60" fill="none" stroke="url(#hrGold)" stroke-width="13"/>
  <ellipse cx="500" cy="702" rx="94" ry="58" fill="none" stroke="url(#hrGold)" stroke-width="13"/>
</g>`

export const heroi = createSpriteMask({
  id: 'heroi',
  name: 'Herói',
  icon: '🦸',
  description: 'Luchador vermelho e ouro',
  defs: DEFS,
  layers: [{ svg: BASE }],
})

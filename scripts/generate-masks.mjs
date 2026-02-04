#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Generate high-quality PNG mask overlays from SVG definitions
// Uses sharp to convert detailed SVGs → transparent PNGs at 1024x1024
// ═══════════════════════════════════════════════════════════════════════════

import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'public', 'masks')

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

const SIZE = 1024

// ─── SVG Mask Definitions ────────────────────────────────────────────────

const masks = {
  'heman-crown': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE44D"/>
      <stop offset="30%" stop-color="#FFD700"/>
      <stop offset="70%" stop-color="#DAA520"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
    <linearGradient id="goldShine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF8DC" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#FFD700" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FFF8DC" stop-opacity="0.6"/>
    </linearGradient>
    <radialGradient id="gem" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FF6B6B"/>
      <stop offset="40%" stop-color="#FF0000"/>
      <stop offset="100%" stop-color="#8B0000"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="metallic">
      <feSpecularLighting specularExponent="30" lighting-color="#FFD700" result="spec">
        <fePointLight x="512" y="200" z="300"/>
      </feSpecularLighting>
      <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    </filter>
  </defs>
  <!-- Crown base band -->
  <path d="M200,580 Q512,520 824,580 L824,620 Q512,560 200,620 Z" fill="url(#gold)" stroke="#B8860B" stroke-width="3" filter="url(#glow)"/>
  <!-- Crown spikes -->
  <path d="M200,580 L260,380 L340,520 L420,320 L512,280 L604,320 L684,520 L764,380 L824,580" fill="url(#gold)" stroke="#B8860B" stroke-width="4"/>
  <!-- Inner crown details -->
  <path d="M260,380 L280,400 L340,520" fill="none" stroke="url(#goldShine)" stroke-width="2"/>
  <path d="M764,380 L744,400 L684,520" fill="none" stroke="url(#goldShine)" stroke-width="2"/>
  <path d="M420,320 L440,360 L512,280 L584,360 L604,320" fill="none" stroke="url(#goldShine)" stroke-width="2"/>
  <!-- Central gem -->
  <ellipse cx="512" cy="400" rx="40" ry="45" fill="url(#gem)" stroke="#8B0000" stroke-width="3" filter="url(#glow)"/>
  <ellipse cx="500" cy="385" rx="15" ry="10" fill="white" opacity="0.6"/>
  <!-- Side gems -->
  <circle cx="340" cy="490" r="18" fill="#4169E1" stroke="#1E3A8A" stroke-width="2" filter="url(#glow)"/>
  <circle cx="684" cy="490" r="18" fill="#4169E1" stroke="#1E3A8A" stroke-width="2" filter="url(#glow)"/>
  <!-- Ornamental scrollwork -->
  <path d="M300,570 Q350,540 400,560" fill="none" stroke="#FFF8DC" stroke-width="2" opacity="0.6"/>
  <path d="M624,560 Q674,540 724,570" fill="none" stroke="#FFF8DC" stroke-width="2" opacity="0.6"/>
  <!-- Crown peak decorations -->
  <circle cx="512" cy="280" r="12" fill="#FFE44D" stroke="#DAA520" stroke-width="2"/>
  <circle cx="260" cy="380" r="8" fill="#FFE44D" stroke="#DAA520" stroke-width="2"/>
  <circle cx="764" cy="380" r="8" fill="#FFE44D" stroke="#DAA520" stroke-width="2"/>
</svg>`,

  'optimus-helmet': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="blue-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4A90D9"/>
      <stop offset="30%" stop-color="#1E3A8A"/>
      <stop offset="70%" stop-color="#1E40AF"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="red-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="50%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E5E7EB"/>
      <stop offset="30%" stop-color="#D1D5DB"/>
      <stop offset="70%" stop-color="#9CA3AF"/>
      <stop offset="100%" stop-color="#6B7280"/>
    </linearGradient>
    <radialGradient id="eye-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#DBEAFE"/>
      <stop offset="40%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </radialGradient>
    <filter id="metal-glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Helmet dome -->
  <path d="M180,550 Q180,120 512,100 Q844,120 844,550" fill="url(#blue-metal)" stroke="#0F172A" stroke-width="5"/>
  <!-- Red stripe accents on dome -->
  <path d="M512,100 L512,550" fill="none" stroke="url(#red-metal)" stroke-width="8" opacity="0.7"/>
  <path d="M350,150 Q350,250 350,400" fill="none" stroke="url(#red-metal)" stroke-width="4" opacity="0.5"/>
  <path d="M674,150 Q674,250 674,400" fill="none" stroke="url(#red-metal)" stroke-width="4" opacity="0.5"/>
  <!-- Face plate -->
  <path d="M300,380 L300,700 Q512,750 724,700 L724,380 Q512,340 300,380 Z" fill="url(#silver)" stroke="#374151" stroke-width="3"/>
  <!-- Eye windows -->
  <path d="M330,420 L470,400 L470,490 L330,500 Z" fill="#0F172A" stroke="#374151" stroke-width="2"/>
  <path d="M554,400 L694,420 L694,500 L554,490 Z" fill="#0F172A" stroke="#374151" stroke-width="2"/>
  <!-- Eye glows -->
  <ellipse cx="400" cy="450" rx="50" ry="30" fill="url(#eye-glow)" filter="url(#metal-glow)" opacity="0.9"/>
  <ellipse cx="624" cy="450" rx="50" ry="30" fill="url(#eye-glow)" filter="url(#metal-glow)" opacity="0.9"/>
  <!-- Mouth grille -->
  <rect x="400" y="600" width="224" height="80" rx="10" fill="#1F2937" stroke="#374151" stroke-width="2"/>
  <line x1="430" y1="610" x2="430" y2="670" stroke="#4B5563" stroke-width="2"/>
  <line x1="470" y1="610" x2="470" y2="670" stroke="#4B5563" stroke-width="2"/>
  <line x1="512" y1="610" x2="512" y2="670" stroke="#4B5563" stroke-width="2"/>
  <line x1="554" y1="610" x2="554" y2="670" stroke="#4B5563" stroke-width="2"/>
  <line x1="594" y1="610" x2="594" y2="670" stroke="#4B5563" stroke-width="2"/>
  <!-- Panel lines on face plate -->
  <line x1="310" y1="540" x2="500" y2="530" stroke="#6B7280" stroke-width="1.5" opacity="0.6"/>
  <line x1="524" y1="530" x2="714" y2="540" stroke="#6B7280" stroke-width="1.5" opacity="0.6"/>
  <!-- Antennae -->
  <line x1="280" y1="200" x2="200" y2="80" stroke="#4B5563" stroke-width="6" stroke-linecap="round"/>
  <line x1="744" y1="200" x2="824" y2="80" stroke="#4B5563" stroke-width="6" stroke-linecap="round"/>
  <circle cx="200" cy="80" r="10" fill="#60A5FA" filter="url(#metal-glow)"/>
  <circle cx="824" cy="80" r="10" fill="#60A5FA" filter="url(#metal-glow)"/>
  <!-- Autobot insignia -->
  <path d="M512,250 L480,290 L500,310 L512,295 L524,310 L544,290 Z" fill="#DC2626" stroke="#991B1B" stroke-width="2" filter="url(#metal-glow)"/>
</svg>`,

  'freddie-mustache-crown': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="mustache-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3D2B1F"/>
      <stop offset="50%" stop-color="#1A1A1A"/>
      <stop offset="100%" stop-color="#2D1B1B"/>
    </linearGradient>
    <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE44D"/>
      <stop offset="40%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
    <filter id="soft-glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Royal crown (upper portion) -->
  <path d="M250,320 L300,150 L380,260 L460,100 L512,80 L564,100 L644,260 L724,150 L774,320 Z" fill="url(#crown-gold)" stroke="#B8860B" stroke-width="3" filter="url(#soft-glow)"/>
  <path d="M250,320 Q512,280 774,320 L774,360 Q512,320 250,360 Z" fill="url(#crown-gold)" stroke="#B8860B" stroke-width="2"/>
  <!-- Crown jewels -->
  <circle cx="512" cy="120" r="22" fill="#9333EA" stroke="#6B21A8" stroke-width="3" filter="url(#soft-glow)"/>
  <circle cx="380" cy="230" r="14" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
  <circle cx="644" cy="230" r="14" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
  <circle cx="300" cy="200" r="10" fill="#2563EB" stroke="#1E3A8A" stroke-width="2"/>
  <circle cx="724" cy="200" r="10" fill="#2563EB" stroke="#1E3A8A" stroke-width="2"/>
  <!-- Crown cross decorations -->
  <rect x="505" y="95" width="14" height="50" rx="3" fill="#FFE44D" opacity="0.6"/>
  <rect x="493" y="110" width="38" height="14" rx="3" fill="#FFE44D" opacity="0.6"/>
  <!-- Iconic thick mustache (lower portion) -->
  <path d="M340,680 Q380,640 440,650 Q490,660 512,670 Q534,660 584,650 Q644,640 684,680 Q660,700 600,700 Q560,700 512,690 Q464,700 424,700 Q364,700 340,680 Z" fill="url(#mustache-grad)" stroke="#1A1A1A" stroke-width="2"/>
  <!-- Mustache detail lines -->
  <path d="M400,660 Q450,665 512,670" fill="none" stroke="#4A4A4A" stroke-width="1.5" opacity="0.5"/>
  <path d="M512,670 Q574,665 624,660" fill="none" stroke="#4A4A4A" stroke-width="1.5" opacity="0.5"/>
  <path d="M360,675 Q430,675 512,680" fill="none" stroke="#4A4A4A" stroke-width="1.5" opacity="0.5"/>
  <path d="M512,680 Q594,675 664,675" fill="none" stroke="#4A4A4A" stroke-width="1.5" opacity="0.5"/>
  <!-- Mustache thickness highlights -->
  <path d="M380,655 Q440,645 512,655 Q584,645 644,655" fill="none" stroke="#5C3D2E" stroke-width="3" opacity="0.4"/>
</svg>`,

  'knightrider-hair-scanner': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="dark-hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4A3728"/>
      <stop offset="40%" stop-color="#3D2B1F"/>
      <stop offset="100%" stop-color="#1A0F0A"/>
    </linearGradient>
    <linearGradient id="leather" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3D2B1F"/>
      <stop offset="50%" stop-color="#1A1A1A"/>
      <stop offset="100%" stop-color="#0D0D0D"/>
    </linearGradient>
    <linearGradient id="scanner-red" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="40%" stop-color="#FF0000" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#FF0000"/>
      <stop offset="60%" stop-color="#FF0000" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <linearGradient id="aviator-lens" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#87CEEB" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#4B5563" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#1F2937" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="hair-shadow">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- 80s voluminous feathered hair -->
  <ellipse cx="512" cy="280" rx="380" ry="300" fill="url(#dark-hair)" filter="url(#hair-shadow)"/>
  <!-- Feathered layers -->
  <path d="M160,320 Q200,200 350,180 Q400,100 512,80 Q624,100 674,180 Q824,200 864,320" fill="url(#dark-hair)" stroke="#2D1B1B" stroke-width="2"/>
  <!-- Hair strands/texture -->
  <path d="M300,150 Q320,200 340,350" fill="none" stroke="#5C4033" stroke-width="3" opacity="0.5"/>
  <path d="M400,100 Q420,200 430,350" fill="none" stroke="#5C4033" stroke-width="3" opacity="0.5"/>
  <path d="M512,80 Q512,180 512,320" fill="none" stroke="#5C4033" stroke-width="3" opacity="0.4"/>
  <path d="M624,100 Q604,200 594,350" fill="none" stroke="#5C4033" stroke-width="3" opacity="0.5"/>
  <path d="M724,150 Q704,200 684,350" fill="none" stroke="#5C4033" stroke-width="3" opacity="0.5"/>
  <!-- Side feathers (80s wings) -->
  <path d="M150,350 Q120,400 140,500" fill="url(#dark-hair)" stroke="#2D1B1B" stroke-width="2"/>
  <path d="M874,350 Q904,400 884,500" fill="url(#dark-hair)" stroke="#2D1B1B" stroke-width="2"/>
  <!-- Aviator sunglasses -->
  <path d="M280,470 Q280,420 390,415 Q440,415 460,430 Q480,450 490,470 Q490,510 420,530 Q320,540 280,470 Z" fill="url(#aviator-lens)" stroke="#B8860B" stroke-width="3"/>
  <path d="M534,470 Q534,450 544,430 Q564,415 634,415 Q744,420 744,470 Q744,540 604,530 Q534,510 534,470 Z" fill="url(#aviator-lens)" stroke="#B8860B" stroke-width="3"/>
  <!-- Aviator bridge -->
  <path d="M490,445 Q512,435 534,445" fill="none" stroke="#B8860B" stroke-width="4"/>
  <!-- KITT scanner bar -->
  <rect x="260" y="555" width="504" height="14" rx="7" fill="#1F2937" stroke="#374151" stroke-width="1.5"/>
  <rect x="450" y="557" width="124" height="10" rx="5" fill="url(#scanner-red)"/>
  <!-- Leather jacket collar -->
  <path d="M200,780 L300,720 L400,750 L512,730 L624,750 L724,720 L824,780 L824,900 Q512,860 200,900 Z" fill="url(#leather)" stroke="#000" stroke-width="3"/>
  <!-- Collar lapels -->
  <path d="M300,720 L360,680 L440,740" fill="url(#leather)" stroke="#2D1B1B" stroke-width="2"/>
  <path d="M724,720 L664,680 L584,740" fill="url(#leather)" stroke="#2D1B1B" stroke-width="2"/>
  <!-- Stitching detail -->
  <path d="M350,750 Q512,730 674,750" fill="none" stroke="#8B4513" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>
</svg>`,

  'jaspion-helmet': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="jaspion-silver" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F0F0F0"/>
      <stop offset="25%" stop-color="#E5E7EB"/>
      <stop offset="50%" stop-color="#D1D5DB"/>
      <stop offset="75%" stop-color="#9CA3AF"/>
      <stop offset="100%" stop-color="#6B7280"/>
    </linearGradient>
    <linearGradient id="jaspion-red" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="50%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#B91C1C"/>
    </linearGradient>
    <radialGradient id="visor-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#00FFFF" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#0891B2" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#164E63" stop-opacity="0.9"/>
    </radialGradient>
    <filter id="visor-filter">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Main helmet dome -->
  <path d="M180,580 Q180,100 512,80 Q844,100 844,580" fill="url(#jaspion-silver)" stroke="#4B5563" stroke-width="4"/>
  <!-- Red central stripe -->
  <path d="M480,80 L480,580 L544,580 L544,80" fill="url(#jaspion-red)" opacity="0.8"/>
  <!-- Red side accents -->
  <path d="M220,300 Q250,200 300,180" fill="none" stroke="url(#jaspion-red)" stroke-width="10" opacity="0.7"/>
  <path d="M804,300 Q774,200 724,180" fill="none" stroke="url(#jaspion-red)" stroke-width="10" opacity="0.7"/>
  <!-- Visor (large curved window) -->
  <path d="M260,380 Q512,330 764,380 Q764,500 660,520 Q512,540 364,520 Q260,500 260,380 Z" fill="url(#visor-glow)" stroke="#0E7490" stroke-width="3" filter="url(#visor-filter)"/>
  <!-- Visor scan lines -->
  <line x1="300" y1="410" x2="724" y2="400" stroke="#00FFFF" stroke-width="1" opacity="0.3"/>
  <line x1="300" y1="440" x2="724" y2="430" stroke="#00FFFF" stroke-width="1" opacity="0.3"/>
  <line x1="300" y1="470" x2="724" y2="460" stroke="#00FFFF" stroke-width="1" opacity="0.3"/>
  <line x1="300" y1="500" x2="724" y2="490" stroke="#00FFFF" stroke-width="1" opacity="0.3"/>
  <!-- Face guard / chin piece -->
  <path d="M340,540 Q512,520 684,540 L684,700 Q512,740 340,700 Z" fill="url(#jaspion-silver)" stroke="#6B7280" stroke-width="2"/>
  <!-- Ventilation grilles -->
  <rect x="440" y="620" width="144" height="50" rx="8" fill="#374151" stroke="#4B5563" stroke-width="1.5"/>
  <line x1="465" y1="625" x2="465" y2="665" stroke="#6B7280" stroke-width="2"/>
  <line x1="490" y1="625" x2="490" y2="665" stroke="#6B7280" stroke-width="2"/>
  <line x1="512" y1="625" x2="512" y2="665" stroke="#6B7280" stroke-width="2"/>
  <line x1="535" y1="625" x2="535" y2="665" stroke="#6B7280" stroke-width="2"/>
  <line x1="560" y1="625" x2="560" y2="665" stroke="#6B7280" stroke-width="2"/>
  <!-- Antenna/communication gear -->
  <line x1="300" y1="180" x2="240" y2="60" stroke="#9CA3AF" stroke-width="5" stroke-linecap="round"/>
  <line x1="724" y1="180" x2="784" y2="60" stroke="#9CA3AF" stroke-width="5" stroke-linecap="round"/>
  <circle cx="240" cy="60" r="10" fill="#00FF00" opacity="0.9" filter="url(#visor-filter)"/>
  <circle cx="784" cy="60" r="10" fill="#00FF00" opacity="0.9" filter="url(#visor-filter)"/>
  <!-- Helmet panel lines -->
  <path d="M350,200 Q512,180 674,200" fill="none" stroke="#9CA3AF" stroke-width="1.5" opacity="0.5"/>
  <path d="M300,300 Q512,270 724,300" fill="none" stroke="#9CA3AF" stroke-width="1.5" opacity="0.5"/>
</svg>`,

  'shera-tiara': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="shera-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE44D"/>
      <stop offset="30%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#DAA520"/>
    </linearGradient>
    <radialGradient id="power-gem" cx="0.5" cy="0.4" r="0.5">
      <stop offset="0%" stop-color="#E0F2FE"/>
      <stop offset="30%" stop-color="#60A5FA"/>
      <stop offset="70%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </radialGradient>
    <filter id="sparkle-glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Wings/side ornaments -->
  <path d="M140,500 Q180,420 260,400 Q300,440 320,500" fill="url(#shera-gold)" stroke="#B8860B" stroke-width="2" filter="url(#sparkle-glow)"/>
  <path d="M884,500 Q844,420 764,400 Q724,440 704,500" fill="url(#shera-gold)" stroke="#B8860B" stroke-width="2" filter="url(#sparkle-glow)"/>
  <!-- Tiara band -->
  <path d="M240,520 Q512,460 784,520 L784,560 Q512,500 240,560 Z" fill="url(#shera-gold)" stroke="#B8860B" stroke-width="3"/>
  <!-- Central crown peak -->
  <path d="M420,520 L460,350 L512,280 L564,350 L604,520" fill="url(#shera-gold)" stroke="#B8860B" stroke-width="3" filter="url(#sparkle-glow)"/>
  <!-- Side peaks -->
  <path d="M310,520 L340,400 L380,520" fill="url(#shera-gold)" stroke="#B8860B" stroke-width="2"/>
  <path d="M644,520 L684,400 L714,520" fill="url(#shera-gold)" stroke="#B8860B" stroke-width="2"/>
  <!-- Central power gem -->
  <ellipse cx="512" cy="380" rx="45" ry="50" fill="url(#power-gem)" stroke="#1E3A8A" stroke-width="3" filter="url(#sparkle-glow)"/>
  <ellipse cx="500" cy="365" rx="18" ry="12" fill="white" opacity="0.7"/>
  <!-- Gem facet lines -->
  <line x1="512" y1="330" x2="480" y2="380" stroke="#93C5FD" stroke-width="1" opacity="0.5"/>
  <line x1="512" y1="330" x2="544" y2="380" stroke="#93C5FD" stroke-width="1" opacity="0.5"/>
  <line x1="512" y1="430" x2="480" y2="380" stroke="#93C5FD" stroke-width="1" opacity="0.5"/>
  <line x1="512" y1="430" x2="544" y2="380" stroke="#93C5FD" stroke-width="1" opacity="0.5"/>
  <!-- Decorative scrollwork -->
  <path d="M380,510 Q420,490 460,505" fill="none" stroke="#FFF8DC" stroke-width="2" opacity="0.7"/>
  <path d="M564,505 Q604,490 644,510" fill="none" stroke="#FFF8DC" stroke-width="2" opacity="0.7"/>
  <!-- Small accent gems on peaks -->
  <circle cx="340" cy="400" r="12" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2" filter="url(#sparkle-glow)"/>
  <circle cx="684" cy="400" r="12" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2" filter="url(#sparkle-glow)"/>
  <!-- Crown tip decoration -->
  <path d="M500,280 L512,250 L524,280" fill="#FFE44D" stroke="#DAA520" stroke-width="2"/>
</svg>`,

  'jem-stars': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="pink-star" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="30%" stop-color="#FF69B4"/>
      <stop offset="100%" stop-color="#FF1493"/>
    </radialGradient>
    <linearGradient id="holographic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF69B4"/>
      <stop offset="25%" stop-color="#DA70D6"/>
      <stop offset="50%" stop-color="#00FFFF"/>
      <stop offset="75%" stop-color="#FF69B4"/>
      <stop offset="100%" stop-color="#DA70D6"/>
    </linearGradient>
    <filter id="star-glow">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Left star earring -->
  <g transform="translate(180, 500)" filter="url(#star-glow)">
    <polygon points="0,-80 22,-22 80,-25 36,15 50,75 0,40 -50,75 -36,15 -80,-25 -22,-22" fill="url(#pink-star)" stroke="#FF1493" stroke-width="3"/>
    <circle cx="0" cy="0" r="18" fill="white" opacity="0.7"/>
    <!-- Earring chain -->
    <line x1="0" y1="-80" x2="0" y2="-120" stroke="#C0C0C0" stroke-width="3"/>
    <circle cx="0" cy="-120" r="8" fill="none" stroke="#C0C0C0" stroke-width="3"/>
  </g>
  <!-- Right star earring -->
  <g transform="translate(844, 500)" filter="url(#star-glow)">
    <polygon points="0,-80 22,-22 80,-25 36,15 50,75 0,40 -50,75 -36,15 -80,-25 -22,-22" fill="url(#pink-star)" stroke="#FF1493" stroke-width="3"/>
    <circle cx="0" cy="0" r="18" fill="white" opacity="0.7"/>
    <line x1="0" y1="-80" x2="0" y2="-120" stroke="#C0C0C0" stroke-width="3"/>
    <circle cx="0" cy="-120" r="8" fill="none" stroke="#C0C0C0" stroke-width="3"/>
  </g>
  <!-- Holographic hair outline -->
  <path d="M150,300 Q150,50 512,30 Q874,50 874,300 Q874,500 750,600 Q600,680 512,700 Q424,680 274,600 Q150,500 150,300 Z" fill="none" stroke="url(#holographic)" stroke-width="6" opacity="0.7" filter="url(#star-glow)"/>
  <!-- Hair spikes (wild 80s) -->
  <path d="M300,120 L250,20 L350,100" fill="url(#holographic)" stroke="#FF1493" stroke-width="2" opacity="0.6"/>
  <path d="M420,60 L400,-30 L460,40" fill="url(#holographic)" stroke="#FF1493" stroke-width="2" opacity="0.6"/>
  <path d="M512,30 L512,-60 L530,30" fill="url(#holographic)" stroke="#FF1493" stroke-width="2" opacity="0.6"/>
  <path d="M604,60 L624,-30 L564,40" fill="url(#holographic)" stroke="#FF1493" stroke-width="2" opacity="0.6"/>
  <path d="M724,120 L774,20 L674,100" fill="url(#holographic)" stroke="#FF1493" stroke-width="2" opacity="0.6"/>
  <!-- Cheek star -->
  <g transform="translate(700, 550) scale(0.5)" filter="url(#star-glow)">
    <polygon points="0,-60 18,-18 60,-20 28,10 38,58 0,32 -38,58 -28,10 -60,-20 -18,-18" fill="#FF1493" stroke="#FF69B4" stroke-width="2"/>
  </g>
  <!-- Holographic shimmer lines -->
  <line x1="200" y1="200" x2="824" y2="180" stroke="#00FFFF" stroke-width="1.5" opacity="0.3" stroke-dasharray="8,12"/>
  <line x1="200" y1="300" x2="824" y2="280" stroke="#FF69B4" stroke-width="1.5" opacity="0.3" stroke-dasharray="8,12"/>
  <line x1="200" y1="400" x2="824" y2="380" stroke="#DA70D6" stroke-width="1.5" opacity="0.3" stroke-dasharray="8,12"/>
</svg>`,

  'wonderwoman-tiara': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="ww-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE44D"/>
      <stop offset="40%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
    <linearGradient id="ww-red" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
    <filter id="ww-glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Tiara band -->
  <path d="M200,540 Q512,480 824,540 L824,580 Q512,520 200,580 Z" fill="url(#ww-gold)" stroke="#B8860B" stroke-width="3"/>
  <!-- Central V-point with star -->
  <path d="M380,540 L440,420 L512,360 L584,420 L644,540" fill="url(#ww-gold)" stroke="#B8860B" stroke-width="3" filter="url(#ww-glow)"/>
  <!-- Five-pointed star -->
  <g transform="translate(512, 400)" filter="url(#ww-glow)">
    <polygon points="0,-55 13,-18 50,-18 20,5 32,42 0,20 -32,42 -20,5 -50,-18 -13,-18" fill="url(#ww-red)" stroke="#DC2626" stroke-width="3"/>
    <!-- Star shine -->
    <circle cx="-8" cy="-15" r="8" fill="white" opacity="0.5"/>
  </g>
  <!-- Side ornaments (eagle wing shapes) -->
  <path d="M200,540 Q180,500 160,480 Q200,470 240,490 Q240,520 200,540" fill="url(#ww-gold)" stroke="#B8860B" stroke-width="2"/>
  <path d="M824,540 Q844,500 864,480 Q824,470 784,490 Q784,520 824,540" fill="url(#ww-gold)" stroke="#B8860B" stroke-width="2"/>
  <!-- Tiara decorative elements -->
  <path d="M300,530 Q340,510 380,525" fill="none" stroke="#FFF8DC" stroke-width="2" opacity="0.6"/>
  <path d="M644,525 Q684,510 724,530" fill="none" stroke="#FFF8DC" stroke-width="2" opacity="0.6"/>
  <!-- Small accent dots -->
  <circle cx="300" cy="530" r="6" fill="#FFE44D" stroke="#DAA520" stroke-width="1.5"/>
  <circle cx="380" cy="525" r="6" fill="#FFE44D" stroke="#DAA520" stroke-width="1.5"/>
  <circle cx="644" cy="525" r="6" fill="#FFE44D" stroke="#DAA520" stroke-width="1.5"/>
  <circle cx="724" cy="530" r="6" fill="#FFE44D" stroke="#DAA520" stroke-width="1.5"/>
  <!-- Inner tiara edge detail -->
  <path d="M240,560 Q512,510 784,560" fill="none" stroke="#FFF8DC" stroke-width="1.5" opacity="0.5"/>
</svg>`,

  'madonna-bow': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="lace-white" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#F5F5F5"/>
      <stop offset="100%" stop-color="#E8E8E8"/>
    </linearGradient>
    <linearGradient id="lace-pink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB6C1"/>
      <stop offset="100%" stop-color="#FF69B4"/>
    </linearGradient>
    <linearGradient id="cross-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE44D"/>
      <stop offset="50%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#DAA520"/>
    </linearGradient>
    <filter id="lace-shadow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="lace-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="4" fill="none" stroke="#FFB6C1" stroke-width="1" opacity="0.5"/>
      <circle cx="0" cy="0" r="3" fill="none" stroke="#FFB6C1" stroke-width="0.8" opacity="0.3"/>
      <circle cx="20" cy="0" r="3" fill="none" stroke="#FFB6C1" stroke-width="0.8" opacity="0.3"/>
      <circle cx="0" cy="20" r="3" fill="none" stroke="#FFB6C1" stroke-width="0.8" opacity="0.3"/>
      <circle cx="20" cy="20" r="3" fill="none" stroke="#FFB6C1" stroke-width="0.8" opacity="0.3"/>
    </pattern>
  </defs>
  <!-- Headband arc -->
  <path d="M180,500 Q260,380 380,340 Q512,310 644,340 Q764,380 844,500" fill="none" stroke="url(#lace-white)" stroke-width="18" filter="url(#lace-shadow)"/>
  <path d="M180,500 Q260,380 380,340 Q512,310 644,340 Q764,380 844,500" fill="none" stroke="url(#lace-pattern)" stroke-width="16" opacity="0.6"/>
  <!-- Left bow loop -->
  <ellipse cx="420" cy="310" rx="100" ry="60" transform="rotate(-15, 420, 310)" fill="url(#lace-white)" stroke="#FFB6C1" stroke-width="2" filter="url(#lace-shadow)"/>
  <ellipse cx="420" cy="310" rx="95" ry="55" transform="rotate(-15, 420, 310)" fill="url(#lace-pattern)" opacity="0.4"/>
  <!-- Right bow loop -->
  <ellipse cx="604" cy="310" rx="100" ry="60" transform="rotate(15, 604, 310)" fill="url(#lace-white)" stroke="#FFB6C1" stroke-width="2" filter="url(#lace-shadow)"/>
  <ellipse cx="604" cy="310" rx="95" ry="55" transform="rotate(15, 604, 310)" fill="url(#lace-pattern)" opacity="0.4"/>
  <!-- Bow center knot -->
  <ellipse cx="512" cy="320" rx="40" ry="50" fill="url(#lace-pink)" stroke="#FF69B4" stroke-width="2"/>
  <!-- Bow ribbons hanging down -->
  <path d="M480,370 Q460,440 470,520 Q475,550 460,580" fill="none" stroke="url(#lace-white)" stroke-width="12" stroke-linecap="round"/>
  <path d="M544,370 Q564,440 554,520 Q549,550 564,580" fill="none" stroke="url(#lace-white)" stroke-width="12" stroke-linecap="round"/>
  <!-- Left cross earring -->
  <g transform="translate(150, 560)" filter="url(#lace-shadow)">
    <line x1="0" y1="0" x2="0" y2="-40" stroke="#C0C0C0" stroke-width="2"/>
    <rect x="-8" y="0" width="16" height="70" rx="3" fill="url(#cross-gold)" stroke="#B8860B" stroke-width="1.5"/>
    <rect x="-30" y="15" width="60" height="16" rx="3" fill="url(#cross-gold)" stroke="#B8860B" stroke-width="1.5"/>
    <circle cx="0" cy="23" r="6" fill="#FF69B4" opacity="0.8"/>
  </g>
  <!-- Right cross earring -->
  <g transform="translate(874, 560)" filter="url(#lace-shadow)">
    <line x1="0" y1="0" x2="0" y2="-40" stroke="#C0C0C0" stroke-width="2"/>
    <rect x="-8" y="0" width="16" height="70" rx="3" fill="url(#cross-gold)" stroke="#B8860B" stroke-width="1.5"/>
    <rect x="-30" y="15" width="60" height="16" rx="3" fill="url(#cross-gold)" stroke="#B8860B" stroke-width="1.5"/>
    <circle cx="0" cy="23" r="6" fill="#FF69B4" opacity="0.8"/>
  </g>
  <!-- Beauty mark -->
  <circle cx="380" cy="600" r="8" fill="#2D1B1B"/>
</svg>`,

  'cheetara-ears': `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="cheetah-orange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF8C00"/>
      <stop offset="50%" stop-color="#FF6B00"/>
      <stop offset="100%" stop-color="#CC5500"/>
    </linearGradient>
    <linearGradient id="cheetah-inner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB6C1"/>
      <stop offset="100%" stop-color="#FF69B4"/>
    </linearGradient>
    <linearGradient id="cheetah-hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="30%" stop-color="#FF8C00"/>
      <stop offset="70%" stop-color="#FF6347"/>
      <stop offset="100%" stop-color="#FF4500"/>
    </linearGradient>
    <filter id="fur-glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Left ear -->
  <g transform="translate(280, 250)" filter="url(#fur-glow)">
    <!-- Outer ear -->
    <path d="M0,120 L-80,10 L-40,-60 L20,0 L60,40 Z" fill="url(#cheetah-orange)" stroke="#CC5500" stroke-width="3"/>
    <!-- Inner ear -->
    <path d="M0,90 L-50,20 L-25,-25 L15,15 L40,40 Z" fill="url(#cheetah-inner)" stroke="#FF69B4" stroke-width="1.5"/>
    <!-- Fur tufts -->
    <line x1="-20" y1="0" x2="-30" y2="-25" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
    <line x1="0" y1="10" x2="-10" y2="-15" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
    <line x1="20" y1="30" x2="10" y2="5" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- Right ear -->
  <g transform="translate(744, 250)" filter="url(#fur-glow)">
    <path d="M0,120 L80,10 L40,-60 L-20,0 L-60,40 Z" fill="url(#cheetah-orange)" stroke="#CC5500" stroke-width="3"/>
    <path d="M0,90 L50,20 L25,-25 L-15,15 L-40,40 Z" fill="url(#cheetah-inner)" stroke="#FF69B4" stroke-width="1.5"/>
    <line x1="20" y1="0" x2="30" y2="-25" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
    <line x1="0" y1="10" x2="10" y2="-15" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
    <line x1="-20" y1="30" x2="-10" y2="5" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- Cheetah spots on face -->
  <ellipse cx="320" cy="520" rx="12" ry="10" fill="#8B4513" opacity="0.7" transform="rotate(-10,320,520)"/>
  <ellipse cx="350" cy="550" rx="8" ry="7" fill="#8B4513" opacity="0.6"/>
  <ellipse cx="290" cy="545" rx="10" ry="8" fill="#8B4513" opacity="0.7" transform="rotate(15,290,545)"/>
  <ellipse cx="330" cy="580" rx="7" ry="6" fill="#8B4513" opacity="0.5"/>
  <ellipse cx="300" cy="500" rx="9" ry="7" fill="#8B4513" opacity="0.6" transform="rotate(-5,300,500)"/>
  <!-- Right side spots -->
  <ellipse cx="704" cy="520" rx="12" ry="10" fill="#8B4513" opacity="0.7" transform="rotate(10,704,520)"/>
  <ellipse cx="674" cy="550" rx="8" ry="7" fill="#8B4513" opacity="0.6"/>
  <ellipse cx="734" cy="545" rx="10" ry="8" fill="#8B4513" opacity="0.7" transform="rotate(-15,734,545)"/>
  <ellipse cx="694" cy="580" rx="7" ry="6" fill="#8B4513" opacity="0.5"/>
  <ellipse cx="724" cy="500" rx="9" ry="7" fill="#8B4513" opacity="0.6" transform="rotate(5,724,500)"/>
  <!-- Cat nose -->
  <path d="M500,620 L512,600 L524,620 Z" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/>
  <!-- Whiskers -->
  <line x1="460" y1="630" x2="340" y2="620" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="460" y1="640" x2="340" y2="650" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="460" y1="650" x2="350" y2="675" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="564" y1="630" x2="684" y2="620" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="564" y1="640" x2="684" y2="650" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="564" y1="650" x2="674" y2="675" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <!-- ThunderCats emblem on forehead -->
  <g transform="translate(512, 420) scale(0.6)" filter="url(#fur-glow)">
    <circle cx="0" cy="0" r="35" fill="#FFD700" stroke="#FF8C00" stroke-width="3"/>
    <path d="M-15,-10 L-25,-30 L-10,-18 Z" fill="#FF4500"/>
    <path d="M15,-10 L25,-30 L10,-18 Z" fill="#FF4500"/>
    <text x="0" y="8" text-anchor="middle" font-size="28" fill="#FF4500" font-weight="bold">⚡</text>
  </g>
</svg>`
}

// ─── Generate PNGs ───────────────────────────────────────────────────────

async function generateAll() {
  console.log('🎭 Generating professional PNG mask overlays...\n')
  
  for (const [name, svg] of Object.entries(masks)) {
    const outputPath = join(OUTPUT_DIR, `${name}.png`)
    try {
      await sharp(Buffer.from(svg))
        .resize(SIZE, SIZE)
        .png({ quality: 100, compressionLevel: 6 })
        .toFile(outputPath)
      console.log(`  ✅ ${name}.png (${SIZE}x${SIZE})`)
    } catch (err) {
      console.error(`  ❌ ${name}: ${err.message}`)
    }
  }
  
  console.log(`\n🎉 Done! PNGs saved to ${OUTPUT_DIR}`)
}

generateAll().catch(console.error)

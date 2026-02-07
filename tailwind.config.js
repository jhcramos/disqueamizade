/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgba(255, 255, 255, 0.08)',
        
        // ========================================
        // 🎪 BALADA DIGITAL - Anos 90 Modernizado
        // ========================================
        
        // Primary — Laranja Aquecido (CTAs, energia)
        balada: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6B35',  // ← PRINCIPAL
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        
        // Secondary — Amarelo Festa (destaques, badges)
        festa: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#FFD166',  // ← PRINCIPAL
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        
        // Accent — Pink Energia (likes, flash, emoção)
        energia: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#EF476F',  // ← PRINCIPAL
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        
        // Success/XP — Verde Conquista
        conquista: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#06D6A0',  // ← PRINCIPAL
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        
        // Neutral — Azul Noturno (backgrounds)
        noite: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#1A1A2E',  // ← PRINCIPAL (background)
          950: '#0f0f1a',
        },
        
        // Ostentação — Dourado Elite
        elite: {
          light: '#ffd700',
          DEFAULT: '#DAA520',
          dark: '#b8860b',
          glow: 'rgba(218, 165, 32, 0.4)',
        },
        
        // Dark Room — Vermelho Escuro
        darkroom: {
          DEFAULT: '#8B0000',
          light: '#B22222',
          glow: 'rgba(139, 0, 0, 0.3)',
        },
        
        // ─── Aliases (used by HomePage & shared components) ───
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#1A1A2E',
          950: '#0f0f1a',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          light: '#a5b4fc',
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        violet: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        amber: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        
        // Surfaces
        surface: {
          DEFAULT: '#1A1A2E',
          light: '#252542',
          lighter: '#2d2d4a',
          card: 'rgba(37, 37, 66, 0.8)',
          glass: 'rgba(255, 255, 255, 0.05)',
        },
        
        // Semantic (usando nova paleta)
        success: '#06D6A0',
        danger: '#EF476F',
        warning: '#FFD166',
        info: '#3b82f6',
      },
      
      fontFamily: {
        // Moderno com peso (headlines)
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        // Legível (body)
        sans: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      
      fontSize: {
        // Display sizes para impacto
        'display-2xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        // Glows da nova paleta
        'glow-balada': '0 0 30px rgba(255, 107, 53, 0.25)',
        'glow-energia': '0 0 30px rgba(239, 71, 111, 0.25)',
        'glow-conquista': '0 0 30px rgba(6, 214, 160, 0.25)',
        'glow-elite': '0 0 30px rgba(218, 165, 32, 0.35)',
        // Video tiles
        'video': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'video-active': '0 0 0 3px #FF6B35, 0 4px 20px rgba(255, 107, 53, 0.3)',
        'video-flash': '0 0 0 3px #EF476F, 0 0 30px rgba(239, 71, 111, 0.5)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        // Roleta
        'roleta-spin': 'roletaSpin 4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        // Flash de interesse
        'flash-ping': 'flashPing 1s cubic-bezier(0, 0, 0.2, 1)',
        // Grain TV
        'grain': 'grain 0.5s steps(10) infinite',
        // Ostentação
        'shimmer': 'shimmer 2s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        roletaSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(1800deg)' }, // 5 voltas
        },
        flashPing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-15%, 5%)' },
          '30%': { transform: 'translate(7%, -25%)' },
          '40%': { transform: 'translate(-5%, 25%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
          '60%': { transform: 'translate(15%, 0%)' },
          '70%': { transform: 'translate(0%, 15%)' },
          '80%': { transform: 'translate(3%, 35%)' },
          '90%': { transform: 'translate(-10%, 10%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      backgroundImage: {
        // Gradients da balada
        'gradient-balada': 'linear-gradient(135deg, #FF6B35 0%, #EF476F 100%)',
        'gradient-noite': 'linear-gradient(180deg, #1A1A2E 0%, #0f0f1a 100%)',
        'gradient-elite': 'linear-gradient(135deg, #DAA520 0%, #ffd700 50%, #DAA520 100%)',
        // Shimmer para ostentação
        'shimmer-gold': 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}

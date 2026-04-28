import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          600: '#1B4FD8',
          700: '#1239A6',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
          900: '#0F172A',
        },
        score: {
          high: '#16A34A',
          high_bg: '#F0FDF4',
          high_border: '#BBF7D0',
          mid: '#D97706',
          mid_bg: '#FFFBEB',
          mid_border: '#FDE68A',
          low: '#DC2626',
          low_bg: '#FEF2F2',
          low_border: '#FECACA',
        },
        param: {
          ulasim: '#3B82F6',
          imkanlar: '#8B5CF6',
          egitim: '#06B6D4',
          maliyet: '#F59E0B',
          guvenlik: '#10B981',
          saglik: '#EF4444',
          deprem: '#F97316',
          memnuniyet: '#EC4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
      },
      animation: {
        skorPulse: 'skorPulse 400ms ease forwards',
        barDolum: 'barDolum 600ms ease-out forwards',
        adimGiris: 'adimGiris 300ms ease-out forwards',
      },
      keyframes: {
        skorPulse: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        barDolum: {
          'from': { width: '0%' },
        },
        adimGiris: {
          'from': { opacity: '0', transform: 'translateX(20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
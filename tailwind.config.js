/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1C2331',
          dark: '#121722',
          light: '#F4F2EE',
        },
        accent: {
          DEFAULT: '#9E8F70',
          hover: '#8B7C5E',
          light: '#F7F5F1',
          gold: '#B5A585',
        },
        surface: 'var(--card-bg)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        astryx: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          border: 'var(--color-border)',
          accent: '#9E8F70',
        }
      },
      borderRadius: {
        xs: 'var(--ax-radius-xs)',
        sm: 'var(--ax-radius-sm)',
        md: 'var(--ax-radius-md)',
        lg: 'var(--ax-radius-lg)',
        full: 'var(--ax-radius-full)',
      },
      boxShadow: {
        low: 'var(--ax-shadow-low)',
        med: 'var(--ax-shadow-med)',
        high: 'var(--ax-shadow-high)',
      },
      fontFamily: {
        sans: ['var(--font-family-body)', 'Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

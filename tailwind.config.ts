import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
        screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1400px' },
      },
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        'surface-dark': 'var(--surface-dark)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-glow': 'var(--primary-glow)',
        success: 'var(--success)',
        'success-light': 'var(--success-light)',
        warning: 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        danger: 'var(--danger)',
        'danger-light': 'var(--danger-light)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config

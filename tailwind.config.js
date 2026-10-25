/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lita: {
          950: '#0F2E20',
          900: '#163F2C',
          800: '#1E5B3F', // primary — rosemary green
          700: '#256C4B',
          600: '#2F8A5B',
          500: '#45A273',
          400: '#6DB58C',
          300: '#97CBAF',
          200: '#BFE0CC',
          100: '#DDEFE3',
          50: '#F1F8F3',
        },
        ink: { DEFAULT: '#17261E', soft: '#4A5B51', mute: '#7D8C83' },
        line: '#E3EBE6',
        wheat: '#C9A56A',
      },
      fontFamily: {
        brand: ['"Young Serif"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 1px 0 rgba(23,38,30,.04), 0 8px 24px -12px rgba(30,91,63,.28)',
      },
    },
  },
  plugins: [],
}

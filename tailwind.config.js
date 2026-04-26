/** @type {import('tailwindcss').Config} */
export default {
  content: ['./popup.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        mist: '#e2e8f0',
        glow: '#f59e0b',
        mint: '#10b981',
        coral: '#f97316'
      },
      boxShadow: {
        panel: '0 18px 50px rgba(15, 23, 42, 0.14)'
      }
    }
  },
  plugins: []
};

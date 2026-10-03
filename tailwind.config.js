/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        bank: {
          navy: '#0B1A2E',
          'navy-light': '#122B4A',
          'navy-mid': '#1A3A5C',
          blue: '#1A56DB',
          'blue-light': '#2563EB',
          gold: '#D4A853',
          'gold-light': '#E8C374',
          bg: '#F0F4F8',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      boxShadow: {
        'bank': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'bank-hover': '0 8px 30px rgba(15, 23, 42, 0.1), 0 2px 8px rgba(15, 23, 42, 0.06)',
        'bank-lg': '0 10px 40px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};

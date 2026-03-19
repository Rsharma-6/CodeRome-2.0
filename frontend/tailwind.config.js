/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // GitHub dark design system (from plan)
        bg: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        primary: '#58a6ff',
        success: '#3fb950',
        warning: '#d29922',
        danger: '#f85149',
        ai: '#a371f7',
        muted: '#8b949e',
      },
      fontFamily: {
        code: ['JetBrains Mono', 'Fira Code', 'monospace'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

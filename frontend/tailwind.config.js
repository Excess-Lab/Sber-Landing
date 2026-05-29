export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      fontFamily: {
        sb: ['"SB Sans Display"', 'Arial', 'sans-serif'],
      },
      colors: {
        ink: '#000000',
        panel: '#f9f9f9',
        violet: '#b559f3',
      },
      boxShadow: {
        field: '0 18px 48px rgba(0, 0, 0, 0.04)',
        hero: '0 40px 120px rgba(181, 89, 243, 0.18)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF6EE",
          50: "#FFFFFF",
          100: "#FAF6EE",
          200: "#E9E2D2",
        },
        navy: {
          DEFAULT: "#101C34",
          800: "#182645",
          900: "#101C34",
        },
        gold: {
          100: "#FBEACB",
          500: "#E8A33D",
          600: "#D18F26",
        },
        coral: {
          100: "#F7E4DD",
          DEFAULT: "#D9694E",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Sora", "sans-serif"],
      },
    },
  },
  plugins: [],
};

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0a0a12",
        primary: "#FF7900",
        kpiGreen: "#3DFA91",
        kpiRed: "#FF4D4D",
        aiPurple: "#9b5cff",
        aiBlue: "#3d8bff",
      },
      backgroundColor: {
        glassLight: "rgba(255, 121, 0, 0.04)",
        glassMedium: "rgba(255, 121, 0, 0.12)",
        glassStrong: "rgba(255, 121, 0, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 25px rgba(255,121,0,0.15)",
      }
    },
  },
  plugins: [],
};
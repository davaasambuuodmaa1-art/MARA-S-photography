import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0908",
        charcoal: "#17130f",
        espresso: "#2b1d16",
        smoke: "#6b6157",
        cream: "#f8f2e7",
        ivory: "#fcf8f1",
        sand: "#efe3d1",
        beige: "#e2d2ba",
        blush: "#e7cfc9",
        taupe: "#a3947f",
        champagne: "#cdaf86",
        gold: "#a9855b",
        burgundy: "#561b27",
        wine: "#3f1019",
      },
      fontFamily: {
        serif: ["'Bodoni Moda'", "'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["Jost", "system-ui", "-apple-system", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.32em",
        widest3: "0.46em",
      },
      boxShadow: {
        luxe: "0 40px 100px -40px rgba(10, 9, 8, 0.4)",
        card: "0 22px 60px -34px rgba(10, 9, 8, 0.5)",
        frame: "0 30px 90px -50px rgba(43, 29, 22, 0.55)",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        kenburns: {
          "0%": { transform: "scale(1.04) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.16) translate3d(-1.5%, -1.5%, 0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
        floatUp: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        heroRise: {
          from: { opacity: "0", transform: "translateY(110%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        heroScale: {
          from: { opacity: "0", transform: "scale(1.14)" },
          to: { opacity: "1", transform: "scale(1.03)" },
        },
        lineGrow: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        kenburns: "kenburns 26s ease-out forwards",
        marquee: "marquee 46s linear infinite",
        shimmer: "shimmer 1.6s linear infinite",
        floatUp: "floatUp 5s ease-in-out infinite",
        fadeIn: "fadeIn .5s ease-out both",
        heroRise: "heroRise 1.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        heroScale: "heroScale 2.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        lineGrow: "lineGrow 1.4s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;

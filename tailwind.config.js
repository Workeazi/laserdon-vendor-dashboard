/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: "class",
  theme: {
      extend: {
          "colors": {
              "brand": {
                  "DEFAULT": "#0053db",
                  "light": "#dbe1ff",
                  "dark": "#00174b"
              },
              "tertiary": "#784b00",
              "outline": "#737686",
              "surface-container-highest": "#d8e3fb",
              "tertiary-container": "#996100",
              "inverse-surface": "#1A1C1E",
              "tertiary-fixed": "#ffddb8",
              "secondary-fixed": "#6ffbbe",
              "surface-container": "#e7eeff",
              "surface-dim": "#cfdaf2",
              "on-primary-fixed-variant": "#003ea8",
              "primary-fixed-dim": "#b4c5ff",
              "on-secondary-fixed": "#002113",
              "surface-container-high": "#dee8ff",
              "surface-variant": "#d8e3fb",
              "surface-tint": "#0053db",
              "on-tertiary-fixed-variant": "#653e00",
              "primary-container": "#2563eb",
              "error": "#B3261E",
              "on-secondary": "#ffffff",
              "surface-container-lowest": "#ffffff",
              "secondary-fixed-dim": "#4edea3",
              "primary-fixed": "#dbe1ff",
              "surface-container-low": "#f0f3ff",
              "on-surface-variant": "#434655",
              "on-tertiary-fixed": "#2a1700",
              "on-tertiary": "#ffffff",
              "on-surface": "#111c2d",
              "on-secondary-container": "#00714d",
              "error-container": "#F9DEDC",
              "secondary": "#006c49",
              "secondary-container": "#E8F5E9",
              "on-primary": "#ffffff",
              "surface-bright": "#f9f9ff",
              "primary": "#0053db",
              "surface": "#f9f9ff",
              "on-background": "#111c2d",
              "tertiary-fixed-dim": "#ffb95f",
              "outline-variant": "#E0E2EC",
              "on-secondary-fixed-variant": "#005236",
              "inverse-on-surface": "#ecf1ff",
              "on-error-container": "#410002",
              "on-primary-container": "#eeefff",
              "on-error": "#ffffff",
              "background": "#F8FAFC",
              "inverse-primary": "#b4c5ff",
              "on-tertiary-container": "#ffeedd",
              "on-primary-fixed": "#00174b"
          },
          "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
          },
          "spacing": {
              "stack_space": "24px",
              "card_gap": "24px",
              "section_margin": "48px",
              "sidebar_width": "260px",
              "container_padding": "40px"
          },
          "fontFamily": {
              "display-metrics": ["Manrope", "sans-serif"],
              "body-md": ["Inter", "sans-serif"],
              "body-lg": ["Inter", "sans-serif"],
              "headline-lg": ["Manrope", "sans-serif"],
              "headline-md": ["Manrope", "sans-serif"],
              "label-caps": ["Inter", "sans-serif"],
              "headline-lg-mobile": ["Manrope", "sans-serif"]
          },
          "fontSize": {
              "display-metrics": ["30px", { "lineHeight": "38px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
              "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
              "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
              "headline-lg": ["22px", { "lineHeight": "28px", "fontWeight": "600" }],
              "headline-md": ["18px", { "lineHeight": "26px", "fontWeight": "600" }],
              "label-caps": ["11px", { "lineHeight": "16px", "letterSpacing": "0.06em", "fontWeight": "600" }],
              "headline-lg-mobile": ["18px", { "lineHeight": "26px", "fontWeight": "600" }]
          }
      },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ]
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        admin: {
          canvas: {
            DEFAULT: 'hsl(var(--admin-canvas) / <alpha-value>)',
            soft: 'hsl(var(--admin-canvas-soft) / <alpha-value>)',
            warm: 'hsl(var(--admin-canvas-warm) / <alpha-value>)',
          },
          panel: {
            DEFAULT: 'hsl(var(--admin-panel) / <alpha-value>)',
            muted: 'hsl(var(--admin-panel-muted) / <alpha-value>)',
          },
          border: 'hsl(var(--admin-border) / <alpha-value>)',
          foreground: 'hsl(var(--admin-foreground) / <alpha-value>)',
          muted: 'hsl(var(--admin-muted) / <alpha-value>)',
          info: {
            DEFAULT: 'hsl(var(--admin-info) / <alpha-value>)',
            soft: 'hsl(var(--admin-info-soft) / <alpha-value>)',
            border: 'hsl(var(--admin-info-border) / <alpha-value>)',
            foreground: 'hsl(var(--admin-info-foreground) / <alpha-value>)',
          },
          success: {
            DEFAULT: 'hsl(var(--admin-success) / <alpha-value>)',
            soft: 'hsl(var(--admin-success-soft) / <alpha-value>)',
            border: 'hsl(var(--admin-success-border) / <alpha-value>)',
            foreground: 'hsl(var(--admin-success-foreground) / <alpha-value>)',
          },
          warning: {
            DEFAULT: 'hsl(var(--admin-warning) / <alpha-value>)',
            soft: 'hsl(var(--admin-warning-soft) / <alpha-value>)',
            border: 'hsl(var(--admin-warning-border) / <alpha-value>)',
            foreground: 'hsl(var(--admin-warning-foreground) / <alpha-value>)',
          },
          danger: {
            DEFAULT: 'hsl(var(--admin-danger) / <alpha-value>)',
            soft: 'hsl(var(--admin-danger-soft) / <alpha-value>)',
            border: 'hsl(var(--admin-danger-border) / <alpha-value>)',
            foreground: 'hsl(var(--admin-danger-foreground) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'hsl(var(--admin-accent) / <alpha-value>)',
            soft: 'hsl(var(--admin-accent-soft) / <alpha-value>)',
            border: 'hsl(var(--admin-accent-border) / <alpha-value>)',
            foreground: 'hsl(var(--admin-accent-foreground) / <alpha-value>)',
          },
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

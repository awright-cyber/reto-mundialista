// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#F5C518',
        gold2: '#E8A800',
        dark: '#0A0E1A',
        dark2: '#111827',
        dark3: '#1C2333',
        card: '#1E2535',
        card2: '#242B3D',
        brand: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          400: '#F5C518',
          500: '#E8A800',
          900: '#1A1200'
        }
      },
      fontFamily: {
        head: ['var(--font-head)', 'Impact', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease',
        'fade-in': 'fadeIn 0.3s ease',
        'pulse-slow': 'pulse 2s ease infinite',
        'bounce-pts': 'bouncePts 0.5s ease',
      },
      keyframes: {
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        bouncePts: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.2)' } }
      }
    },
  },
  plugins: [],
}

// ============================================================
// next.config.js
// ============================================================
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir imágenes de API externa
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      // Permitir iframe desde Plaza Las Américas
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOW-FROM https://www.plazalasamericas.ec' },
        ],
      },
    ];
  },
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_PREDICTIONS_LOCK: '2026-06-11T04:59:00Z',
  }
};

module.exports = nextConfig;

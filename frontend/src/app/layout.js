import { Barlow_Condensed, Barlow } from 'next/font/google';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-head',
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Reto Mundialista — Plaza Las Américas 2026',
  description: 'Predice todos los partidos del Mundial 2026 y gana premios exclusivos en Plaza Las Américas. ¡Participación 100% gratuita!',
  openGraph: {
    title: 'Reto Mundialista — Plaza Las Américas',
    description: 'Predice el Mundial 2026 y gana en Plaza Las Américas. Gratis.',
    url: 'https://reto.plazalasamericas.ec',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}

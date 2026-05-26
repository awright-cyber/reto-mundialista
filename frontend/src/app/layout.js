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
  icons: {
    icon: 'https://i.imgur.com/fcCIRc7.png',
    apple: 'https://i.imgur.com/fcCIRc7.png',
  },
  openGraph: {
    title: 'Reto Mundialista — Plaza Las Américas',
    description: 'Predice el Mundial 2026 y gana en Plaza Las Américas. Gratis.',
    url: 'https://reto.plazalasamericas.ec',
    images: ['https://i.imgur.com/fcCIRc7.png'],
  },
};

export default function RootLayout({ children }) {
  const colorScript = `
    try {
      var c=JSON.parse(localStorage.getItem('reto_cms')||'{}'),r=document.documentElement;
      function h(x){var v=x.replace('#','');return parseInt(v.slice(0,2),16)+','+parseInt(v.slice(2,4),16)+','+parseInt(v.slice(4,6),16);}
      if(c.color_background){r.style.setProperty('--dark',c.color_background);r.style.setProperty('--dark2',c.color_background);r.style.setProperty('--dark-rgb',h(c.color_background));}
      if(c.color_primary){r.style.setProperty('--gold',c.color_primary);r.style.setProperty('--gold2',c.color_primary);r.style.setProperty('--gold-rgb',h(c.color_primary));}
      if(c.color_text)r.style.setProperty('--text',c.color_text);
      if(c.color_card){r.style.setProperty('--card',c.color_card);r.style.setProperty('--dark3',c.color_card);}
      if(c.color_muted)r.style.setProperty('--muted',c.color_muted);
    } catch(e){}
  `;
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

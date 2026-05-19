// src/app/layout.js — Layout principal de Next.js
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
  keywords: 'mundial 2026, predicciones, ecuador, plaza las americas, fifa world cup',
  openGraph: {
    title: 'Reto Mundialista — Plaza Las Américas',
    description: 'Predice el Mundial 2026 y gana en Plaza Las Américas. Gratis.',
    images: ['/og-image.jpg'],
    url: 'https://reto.plazalasamericas.ec',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reto Mundialista — Plaza Las Américas 2026',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}

// ============================================================
// src/app/globals.css
// ============================================================
/*
:root {
  --gold: #F5C518;
  --gold2: #E8A800;
  --red: #E63946;
  --dark: #0A0E1A;
  --dark2: #111827;
  --dark3: #1C2333;
  --card: #1E2535;
  --card2: #242B3D;
  --text: #F0F4FF;
  --muted: #8899BB;
  --green: #22C55E;
  --blue: #3B82F6;
  --orange: #F97316;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--dark); color: var(--text); font-family: var(--font-body); }
*/

// ============================================================
// src/app/page.js — Landing page
// ============================================================
import LandingPage from '@/components/LandingPage';

export default function Home() {
  return <LandingPage />;
}

// ============================================================
// src/app/registro/page.js
// ============================================================
import RegistroPage from '@/components/RegistroPage';

export default function Registro() {
  return <RegistroPage />;
}

// ============================================================
// src/app/predicciones/page.js
// ============================================================
import PrediccionesPage from '@/components/PrediccionesPage';
import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function Predicciones() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/registro');
  return <PrediccionesPage />;
}

// ============================================================
// src/app/dashboard/page.js
// ============================================================
import DashboardPage from '@/components/DashboardPage';

export default function Dashboard() {
  return <DashboardPage />;
}

// ============================================================
// src/app/ranking/page.js
// ============================================================
import RankingPage from '@/components/RankingPage';

export default function Ranking() {
  return <RankingPage />;
}

// ============================================================
// src/app/admin/page.js
// ============================================================
import AdminPage from '@/components/AdminPage';

export default function Admin() {
  return <AdminPage />;
}

// ============================================================
// src/app/api/cron/sync-results/route.js
// ============================================================
import { syncWorldCupResults } from '@/lib/syncResults';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncWorldCupResults();
    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// src/app/api/predictions/route.js
// ============================================================
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: 'No autenticado' }, { status: 401 });

  const lockDate = new Date(process.env.PREDICTIONS_LOCK_DATE);
  if (new Date() > lockDate) {
    return Response.json({ error: 'Predicciones cerradas' }, { status: 403 });
  }

  const body = await request.json();
  const { data: user } = await supabase
    .from('users')
    .select('id, predictions_locked')
    .eq('auth_id', session.user.id)
    .single();

  if (!user) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (user.predictions_locked) return Response.json({ error: 'Predicciones bloqueadas' }, { status: 403 });

  const rows = body.predictions.map(p => ({
    user_id: user.id,
    match_id: p.matchId,
    predicted_score_a: p.scoreA,
    predicted_score_b: p.scoreB
  }));

  const { error } = await supabase
    .from('predictions')
    .upsert(rows, { onConflict: 'user_id,match_id' });

  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ success: true });
}

// ============================================================
// src/app/api/auth/register/route.js
// ============================================================
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  const body = await request.json();
  const supabase = createAdminClient();

  // Verificar cédula única
  const { data: existing } = await supabase
    .from('users').select('id').eq('cedula', body.cedula).single();
  if (existing) {
    return Response.json({ error: 'Esta cédula ya está registrada' }, { status: 409 });
  }

  // Crear en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true
  });
  if (authError) return Response.json({ error: authError.message }, { status: 400 });

  // Crear perfil
  const { data: user, error } = await supabase.from('users').insert({
    auth_id: authData.user.id,
    full_name: body.fullName,
    cedula: body.cedula,
    phone: body.phone,
    email: body.email,
    city: body.city,
    birth_date: body.birthDate,
    accepts_terms: body.acceptsTerms,
    accepts_marketing: body.acceptsMarketing || false
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  await supabase.from('leaderboard').insert({ user_id: user.id });

  return Response.json({ success: true, userId: user.id });
}

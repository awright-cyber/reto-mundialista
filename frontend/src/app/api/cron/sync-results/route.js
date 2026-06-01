// ============================================================
// RUTA CRON — Next.js App Router
// Archivo: frontend/src/app/api/cron/sync-results/route.js
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_KEY = process.env.API_FOOTBALL_KEY;
const FIFA_LEAGUE_ID = 1;
const SEASON = 2026;

const STATUS_MAP = {
  'NS':'pending','TBD':'pending','1H':'live','HT':'live','2H':'live',
  'ET':'live','BT':'live','P':'live','SUSP':'live','INT':'live',
  'FT':'finished','AET':'finished','PEN':'finished',
  'PST':'pending','CANC':'cancelled','ABD':'cancelled'
};

// Nombres que API-Football devuelve en inglés → versión española en la DB
const TEAM_NAME_ES = {
  'Germany':'Alemania','Korea Republic':'Corea del Sur','Korea DPR':'Corea del Norte',
  "Cote d'Ivoire":'Costa de Marfil','Ivory Coast':'Costa de Marfil',
  'Netherlands':'Países Bajos','Japan':'Japón','Sweden':'Suecia',
  'Belgium':'Bélgica','Egypt':'Egipto','Iran':'Irán',
  'New Zealand':'Nueva Zelanda','Spain':'España','Morocco':'Marruecos',
  'Algeria':'Argelia','Jordan':'Jordania',
  'DR Congo':'Congo RD','Congo DR':'Congo RD','Uzbekistan':'Uzbekistán',
  'England':'Inglaterra','Croatia':'Croacia','Panama':'Panamá',
  'Saudi Arabia':'Arabia Saudita','France':'Francia',
  'Iraq':'Irak','Norway':'Noruega',
  'United States':'Estados Unidos','USA':'Estados Unidos',
  'Turkey':'Turquía','Curacao':'Curazao','Haiti':'Haití',
  'Scotland':'Escocia','Bosnia':'Bosnia y Herzegovina','Qatar':'Catar',
  'Switzerland':'Suiza','Brazil':'Brasil','Tunisia':'Túnez',
  'South Africa':'Sudáfrica','Czech Republic':'República Checa',
  'Canada':'Canadá','Cape Verde':'Cabo Verde','Mexico':'México',
};

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncResults();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function syncResults() {
  const today = new Date().toISOString().split('T')[0];

  const [liveData, todayData] = await Promise.all([
    fetchAPI(`/fixtures?live=all&league=${FIFA_LEAGUE_ID}&season=${SEASON}`),
    fetchAPI(`/fixtures?league=${FIFA_LEAGUE_ID}&season=${SEASON}&date=${today}`)
  ]);

  const seen = new Set();
  const fixtures = [...(liveData?.response||[]), ...(todayData?.response||[])]
    .filter(f => {
      if (seen.has(f.fixture.id)) return false;
      seen.add(f.fixture.id);
      return true;
    });

  if (!fixtures.length) return { updated: 0, message: 'No matches today' };

  let updated = 0, pointsCalc = 0, notFound = 0;

  for (const f of fixtures) {
    try {
      const r = await processFixture(f);
      if (r.updated) updated++;
      if (r.points) pointsCalc++;
      if (r.reason === 'match_not_found') notFound++;
    } catch (e) {
      console.error(`Error processing fixture ${f.fixture.id}:`, e.message);
    }
  }

  if (updated > 0) {
    await supabase.rpc('recalculate_leaderboard');
  }

  return { updated, pointsCalc, notFound, total: fixtures.length };
}

async function processFixture({ fixture, goals, teams, score }) {
  const externalId = String(fixture.id);
  const newStatus = STATUS_MAP[fixture.status.short] || 'pending';

  // 1. Buscar por external_id (lo más eficiente, funciona tras el primer mapeo)
  let { data: match } = await supabase
    .from('matches')
    .select('id,status,score_a,score_b,team_a,team_b,phase,team_a_code,team_b_code,stadium')
    .eq('external_id', externalId)
    .maybeSingle();

  // 2. Fallback: buscar por código FIFA de ambos equipos
  if (!match && teams.home.code && teams.away.code) {
    const { data: m } = await supabase
      .from('matches')
      .select('id,status,score_a,score_b,team_a,team_b,phase,team_a_code,team_b_code,stadium')
      .eq('team_a_code', teams.home.code)
      .eq('team_b_code', teams.away.code)
      .maybeSingle();
    if (m) {
      await supabase.from('matches').update({ external_id: externalId }).eq('id', m.id);
      match = m;
    }
  }

  // 3. Fallback: buscar por timestamp del partido (±5 min), desambiguar por código o estadio
  if (!match) {
    const kickoff = new Date(fixture.date);
    const from = new Date(kickoff.getTime() - 5 * 60000).toISOString();
    const to   = new Date(kickoff.getTime() + 5 * 60000).toISOString();

    const { data: candidates } = await supabase
      .from('matches')
      .select('id,status,score_a,score_b,team_a,team_b,phase,team_a_code,team_b_code,stadium')
      .gte('scheduled_at', from)
      .lte('scheduled_at', to);

    if (candidates?.length === 1) {
      match = candidates[0];
    } else if (candidates?.length > 1) {
      // Varios partidos a la misma hora: desambiguar por código de equipo
      match = candidates.find(m =>
        m.team_a_code === teams.home.code ||
        m.team_b_code === teams.away.code
      ) || null;
      // Última opción: por nombre de estadio
      if (!match && fixture.fixture.venue?.name) {
        const venue = fixture.fixture.venue.name;
        match = candidates.find(m =>
          m.stadium && m.stadium.toLowerCase().includes(venue.toLowerCase().split(' ')[0])
        ) || null;
      }
    }

    if (match) {
      await supabase.from('matches').update({ external_id: externalId }).eq('id', match.id);
    }
  }

  if (!match) return { updated: false, reason: 'match_not_found' };

  // Sin cambios: evitar escritura innecesaria
  if (match.status === newStatus && match.score_a === goals.home && match.score_b === goals.away) {
    return { updated: false };
  }

  const pen = score?.penalty;
  const wentToPen = pen?.home !== null && pen?.home !== undefined;
  let winnerCode = null;
  if (newStatus === 'finished') {
    if (wentToPen) winnerCode = pen.home > pen.away ? teams.home.code : teams.away.code;
    else if (goals.home > goals.away) winnerCode = teams.home.code;
    else if (goals.away > goals.home) winnerCode = teams.away.code;
  }

  // Actualizar equipos TBD (grupos sin asignar aún o fases eliminatorias)
  const teamUpdates = {};
  if (match.team_a?.startsWith('TBD')) {
    teamUpdates.team_a = TEAM_NAME_ES[teams.home.name] || teams.home.name;
    teamUpdates.team_a_code = teams.home.code;
  }
  if (match.team_b?.startsWith('TBD')) {
    teamUpdates.team_b = TEAM_NAME_ES[teams.away.name] || teams.away.name;
    teamUpdates.team_b_code = teams.away.code;
  }

  await supabase.from('matches').update({
    status: newStatus,
    score_a: goals.home ?? match.score_a,
    score_b: goals.away ?? match.score_b,
    ...teamUpdates,
    went_to_penalties: wentToPen,
    penalty_score_a: pen?.home ?? null,
    penalty_score_b: pen?.away ?? null,
    winner_code: winnerCode,
    updated_at: new Date().toISOString()
  }).eq('id', match.id);

  let points = false;
  if (newStatus === 'finished' && match.status !== 'finished') {
    await supabase.rpc('calculate_match_points', { p_match_id: match.id });
    points = true;
  }

  return { updated: true, points };
}

async function fetchAPI(endpoint) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://v3.football.api-sports.io${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

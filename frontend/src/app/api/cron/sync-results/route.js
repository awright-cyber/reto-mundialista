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

export async function GET(request) {
  // Verificar autorización
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

  // Obtener partidos en vivo y del día
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

  let updated = 0, pointsCalc = 0;

  for (const f of fixtures) {
    const r = await processFixture(f);
    if (r.updated) updated++;
    if (r.points) pointsCalc++;
  }

  if (updated > 0) {
    await supabase.rpc('recalculate_leaderboard');
  }

  return { updated, pointsCalc, total: fixtures.length };
}

async function processFixture({ fixture, goals, teams, score }) {
  const externalId = String(fixture.id);
  const newStatus = STATUS_MAP[fixture.status.short] || 'pending';

  let { data: match } = await supabase
    .from('matches').select('id,status,score_a,score_b,team_a,team_b,phase')
    .eq('external_id', externalId).single();

  if (!match) {
    // Para fase de grupos: buscar por nombre de equipos (los knockout tienen TBD-*)
    const { data: m } = await supabase.from('matches').select('id,status,score_a,score_b,team_a,team_b,phase')
      .ilike('team_a', `%${teams.home.name.split(' ')[0]}%`)
      .ilike('team_b', `%${teams.away.name.split(' ')[0]}%`)
      .eq('phase', 'grupos').single();
    if (!m) return { updated: false, reason: 'match_not_found' };
    await supabase.from('matches').update({ external_id: externalId }).eq('id', m.id);
    match = m;
  }

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

  // En eliminatorias: actualizar nombres de equipos si aún están como TBD
  const teamUpdates = {};
  if (match.team_a?.startsWith('TBD')) {
    teamUpdates.team_a = teams.home.name;
    teamUpdates.team_a_code = teams.home.code;
  }
  if (match.team_b?.startsWith('TBD')) {
    teamUpdates.team_b = teams.away.name;
    teamUpdates.team_b_code = teams.away.code;
  }

  await supabase.from('matches').update({
    status: newStatus,
    score_a: goals.home ?? match.score_a,
    score_b: goals.away ?? match.score_b,
    ...teamUpdates,
    went_to_penalties: wentToPen,
    penalty_score_a: pen?.home || null,
    penalty_score_b: pen?.away || null,
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
  const res = await fetch(`https://v3.football.api-sports.io${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

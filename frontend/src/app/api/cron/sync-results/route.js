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

const TEAM_NAME_ES = {
  'Germany':'Alemania','Korea Republic':'Corea del Sur','Korea DPR':'Corea del Norte',
  "Cote d'Ivoire":'Costa de Marfil','Ivory Coast':'Costa de Marfil',
  'Netherlands':'Países Bajos','Japan':'Japón','Sweden':'Suecia',
  'Belgium':'Bélgica','Egypt':'Egipto','Iran':'Irán',
  'New Zealand':'Nueva Zelanda','Spain':'España','Morocco':'Marruecos',
  'Algeria':'Argelia','Jordan':'Jordania',
  'DR Congo':'RD Congo','Congo DR':'RD Congo','Uzbekistan':'Uzbekistán',
  'England':'Inglaterra','Croatia':'Croacia','Panama':'Panamá',
  'Saudi Arabia':'Arabia Saudita','France':'Francia',
  'Iraq':'Iraq','Norway':'Noruega',
  'United States':'USA','USA':'USA',
  'Turkey':'Turquía','Curacao':'Curazao','Curaçao':'Curazao','Haiti':'Haití',
  'Scotland':'Escocia','Bosnia':'Bosnia y Herzegovina','Qatar':'Qatar',
  'Switzerland':'Suiza','Brazil':'Brasil','Tunisia':'Túnez',
  'South Africa':'Sudáfrica','Czech Republic':'Chequia',
  'Canada':'Canadá','Cape Verde':'Cabo Verde','Mexico':'México',
  'Cape Verde Islands':'Cabo Verde','Türkiye':'Turquía',
  'South Korea':'Corea del Sur','Bosnia & Herzegovina':'Bosnia y Herzegovina',
};

// Normalizar nombre: mayúsculas + sin tildes
function normStr(s) {
  return (s || '').trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

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
  const SELECT = 'id,status,score_a,score_b,team_a,team_b,phase,team_a_code,team_b_code,stadium';

  // 1. Buscar por external_id
  let { data: match } = await supabase
    .from('matches').select(SELECT)
    .eq('external_id', externalId).maybeSingle();

  // 2. Fallback por nombre de equipo (el API /fixtures no devuelve código FIFA)
  if (!match) {
    const homeName = TEAM_NAME_ES[teams.home.name] || teams.home.name;
    const awayName = TEAM_NAME_ES[teams.away.name] || teams.away.name;

    const { data: m1 } = await supabase.from('matches').select(SELECT)
      .ilike('team_a', homeName).ilike('team_b', awayName).maybeSingle();
    if (m1) {
      await supabase.from('matches').update({ external_id: externalId }).eq('id', m1.id);
      match = m1;
    } else {
      // Orientación invertida
      const { data: m2 } = await supabase.from('matches').select(SELECT)
        .ilike('team_a', awayName).ilike('team_b', homeName).maybeSingle();
      if (m2) {
        await supabase.from('matches').update({ external_id: externalId }).eq('id', m2.id);
        match = m2;
      }
    }
  }

  // 3. Fallback por timestamp ±5 min — desambigua con ambas orientaciones
  if (!match) {
    const kickoff = new Date(fixture.date);
    const from = new Date(kickoff.getTime() - 5 * 60000).toISOString();
    const to   = new Date(kickoff.getTime() + 5 * 60000).toISOString();
    const hc = teams.home.code, ac = teams.away.code;

    const { data: candidates } = await supabase.from('matches').select(SELECT)
      .gte('scheduled_at', from).lte('scheduled_at', to);

    if (candidates?.length === 1) {
      match = candidates[0];
    } else if (candidates?.length > 1) {
      match = candidates.find(m =>
        (m.team_a_code === hc && m.team_b_code === ac) ||
        (m.team_a_code === ac && m.team_b_code === hc)
      ) || null;
      // Último recurso: estadio
      if (!match && fixture.fixture.venue?.name) {
        const venue = fixture.fixture.venue.name.split(' ')[0].toLowerCase();
        match = candidates.find(m =>
          m.stadium && m.stadium.toLowerCase().includes(venue)
        ) || null;
      }
    }
    if (match) {
      await supabase.from('matches').update({ external_id: externalId }).eq('id', match.id);
    }
  }

  if (!match) return { updated: false, reason: 'match_not_found' };

  // Detectar orientación invertida por nombre (API /fixtures no devuelve code)
  // Caso: API home = DB team_b (ej: API tiene Curaçao como home, DB tiene Ecuador como team_a)
  const homeNameES = normStr(TEAM_NAME_ES[teams.home.name] || teams.home.name);
  const flipped = !!(
    match.team_a && match.team_b &&
    normStr(match.team_a) !== homeNameES &&
    normStr(match.team_b) === homeNameES
  );

  const homeGoals = flipped ? goals.away  : goals.home;
  const awayGoals = flipped ? goals.home  : goals.away;

  if (match.status === newStatus && match.score_a === homeGoals && match.score_b === awayGoals) {
    return { updated: false };
  }

  const pen = score?.penalty;
  const wentToPen = pen?.home !== null && pen?.home !== undefined;
  // Usar códigos de la DB (el API /fixtures no devuelve código en el objeto team)
  const teamACode = match.team_a_code;
  const teamBCode = match.team_b_code;
  let winnerCode = null;
  if (newStatus === 'finished') {
    const homeWins = wentToPen ? pen.home > pen.away : homeGoals > awayGoals;
    const awayWins = wentToPen ? pen.away > pen.home : awayGoals > homeGoals;
    if (homeWins) winnerCode = flipped ? teamBCode : teamACode;
    else if (awayWins) winnerCode = flipped ? teamACode : teamBCode;
  }

  // Actualizar equipos TBD respetando la orientación
  // No actualizar team_a_code/team_b_code si el API no devuelve el código (evita borrar el existente)
  const teamUpdates = {};
  if (match.team_a?.startsWith('TBD')) {
    const t = flipped ? teams.away : teams.home;
    teamUpdates.team_a = TEAM_NAME_ES[t.name] || t.name;
    if (t.code) teamUpdates.team_a_code = t.code;
  }
  if (match.team_b?.startsWith('TBD')) {
    const t = flipped ? teams.home : teams.away;
    teamUpdates.team_b = TEAM_NAME_ES[t.name] || t.name;
    if (t.code) teamUpdates.team_b_code = t.code;
  }

  await supabase.from('matches').update({
    status: newStatus,
    score_a: homeGoals ?? match.score_a,
    score_b: awayGoals ?? match.score_b,
    ...teamUpdates,
    went_to_penalties: wentToPen,
    penalty_score_a: (flipped ? pen?.away : pen?.home) ?? null,
    penalty_score_b: (flipped ? pen?.home : pen?.away) ?? null,
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

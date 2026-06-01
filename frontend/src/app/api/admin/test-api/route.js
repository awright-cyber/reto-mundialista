// ============================================================
// ENDPOINT DIAGNÓSTICO — Verificar leagues disponibles en API-Football
// GET /api/admin/test-api?secret=TU_CRON_SECRET
//
// Devuelve JSON con:
//   - Todas las ligas que contienen "World Cup" disponibles en tu cuenta
//   - Fixtures del league_id que indiques (param &league=ID)
// ============================================================

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE = 'https://v3.football.api-sports.io';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leagueId = searchParams.get('league');
  const season   = searchParams.get('season') || '2026';

  try {
    if (leagueId) {
      // Modo 2: mostrar los primeros fixtures de un league_id específico
      const data = await callAPI(`/fixtures?league=${leagueId}&season=${season}&timezone=UTC`);
      const fixtures = data?.response || [];
      return Response.json({
        league_id: leagueId,
        season,
        total_fixtures: fixtures.length,
        sample: fixtures.slice(0, 5).map(f => ({
          id: f.fixture.id,
          date: f.fixture.date,
          home: f.teams.home.name,
          away: f.teams.away.name,
          status: f.fixture.status.short,
        })),
        api_status: data?.results,
        api_errors: data?.errors,
      });
    }

    // Modo 1: buscar todas las ligas que tengan "World" en el nombre
    const data = await callAPI(`/leagues?search=World+Cup`);
    const leagues = (data?.response || []).map(l => ({
      id: l.league.id,
      name: l.league.name,
      type: l.league.type,
      seasons: l.seasons.map(s => ({ year: s.year, start: s.start, end: s.end, current: s.current })),
    }));

    // Verificación directa: leagues?id=1&season=2026
    const dataLeague1 = await callAPI(`/leagues?id=1&season=2026`);
    const league1Info = (dataLeague1?.response || []).map(l => ({
      id: l.league.id,
      name: l.league.name,
      type: l.league.type,
      seasons: l.seasons?.map(s => ({ year: s.year, start: s.start, end: s.end, current: s.current })),
    }));

    return Response.json({
      CHECK_LEAGUE_1_SEASON_2026: {
        found: league1Info.length > 0,
        data: league1Info,
        raw_errors: dataLeague1?.errors,
      },
      world_cup_leagues_search: leagues,
      api_status: data?.results,
      api_errors: data?.errors,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

async function callAPI(endpoint) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

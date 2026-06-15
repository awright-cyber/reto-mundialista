// ============================================================
// ENDPOINT ADMIN — Mapeo pre-torneo de external_id
// GET /api/admin/map-fixtures?secret=TU_CRON_SECRET
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.API_FOOTBALL_KEY;
const FIFA_LEAGUE_ID = 1;
const SEASON = 2026;

// API-Football (inglés) → nombre en la DB (español)
const TEAM_NAME_ES = {
  'Germany':'Alemania','Korea Republic':'Corea del Sur','Korea DPR':'Corea del Norte',
  'South Korea':'Corea del Sur',
  "Cote d'Ivoire":'Costa de Marfil',"Côte d'Ivoire":'Costa de Marfil','Ivory Coast':'Costa de Marfil',
  'Netherlands':'Países Bajos','Japan':'Japón','Sweden':'Suecia',
  'Belgium':'Bélgica','Egypt':'Egipto','Iran':'Irán',
  'New Zealand':'Nueva Zelanda','Spain':'España','Morocco':'Marruecos',
  'Algeria':'Argelia','Jordan':'Jordania',
  'DR Congo':'RD Congo','Congo DR':'RD Congo','Uzbekistan':'Uzbekistán',
  'England':'Inglaterra','Croatia':'Croacia','Panama':'Panamá',
  'Saudi Arabia':'Arabia Saudita','France':'Francia',
  'Iraq':'Iraq','Norway':'Noruega',
  'United States':'USA','USA':'USA',
  'Turkey':'Turquía','Türkiye':'Turquía',
  'Curacao':'Curazao','Curaçao':'Curazao',
  'Haiti':'Haití','Scotland':'Escocia',
  'Bosnia':'Bosnia y Herzegovina','Bosnia & Herzegovina':'Bosnia y Herzegovina',
  'Qatar':'Qatar','Switzerland':'Suiza','Brazil':'Brasil','Tunisia':'Túnez',
  'South Africa':'Sudáfrica','Czech Republic':'Chequia','Czechia':'Chequia',
  'Canada':'Canadá','Cape Verde':'Cabo Verde','Cape Verde Islands':'Cabo Verde',
  'Mexico':'México','Ghana':'Ghana','Colombia':'Colombia',
  'Portugal':'Portugal','Argentina':'Argentina','Uruguay':'Uruguay',
  'Senegal':'Senegal','Ecuador':'Ecuador','Paraguay':'Paraguay',
  'Australia':'Australia','Austria':'Austria',
  'Costa Rica':'Costa Rica',
};

// Normalizar: mayúsculas + sin tildes/diacríticos
function norm(s) {
  return (s || '').trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function toES(apiName) {
  return TEAM_NAME_ES[apiName] || apiName;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await fetchAPI(`/fixtures?league=${FIFA_LEAGUE_ID}&season=${SEASON}`);
    const fixtures = data?.response || [];
    if (!fixtures.length) {
      return Response.json({ error: 'API devolvió 0 fixtures.' }, { status: 502 });
    }

    const { data: dbMatches, error: dbErr } = await supabase
      .from('matches')
      .select('id,scheduled_at,team_a,team_b,team_a_code,team_b_code,external_id,stadium');
    if (dbErr) throw new Error(dbErr.message);

    // ── Índice por nombre normalizado en español ──────────────────────────────
    // Clave: "NORM_A|NORM_B" → { match, flipped }
    const byName = new Map();
    for (const m of dbMatches) {
      if (!m.team_a || m.team_a.startsWith('TBD')) continue;
      if (!m.team_b || m.team_b.startsWith('TBD')) continue;
      const na = norm(m.team_a), nb = norm(m.team_b);
      if (!byName.has(`${na}|${nb}`)) byName.set(`${na}|${nb}`, { match: m, flipped: false });
      if (!byName.has(`${nb}|${na}`)) byName.set(`${nb}|${na}`, { match: m, flipped: true });
    }

    const results = [];
    let mapped = 0, alreadyMapped = 0, notFound = 0;

    // ── PASADA 1: mapeo por nombre (independiente del orden del API) ──────────
    const unmapped = [];
    for (const f of fixtures) {
      const externalId = String(f.fixture.id);
      const hn = norm(toES(f.teams.home.name));
      const an = norm(toES(f.teams.away.name));

      const found = byName.get(`${hn}|${an}`);
      if (!found) { unmapped.push(f); continue; }

      const { match: dbMatch, flipped } = found;

      if (dbMatch.external_id === externalId) {
        alreadyMapped++;
        byName.delete(`${hn}|${an}`);
        byName.delete(`${an}|${hn}`);
        continue;
      }

      const updatePayload = { external_id: externalId };
      if (!dbMatch.team_a || dbMatch.team_a.startsWith('TBD')) {
        updatePayload.team_a = flipped ? toES(f.teams.away.name) : toES(f.teams.home.name);
      }
      if (!dbMatch.team_b || dbMatch.team_b.startsWith('TBD')) {
        updatePayload.team_b = flipped ? toES(f.teams.home.name) : toES(f.teams.away.name);
      }

      const { error: ue } = await supabase.from('matches').update(updatePayload).eq('id', dbMatch.id);
      if (ue) {
        results.push({ status: 'error', id: dbMatch.id, error: ue.message });
      } else {
        mapped++;
        dbMatch.external_id = externalId;
        byName.delete(`${hn}|${an}`);
        byName.delete(`${an}|${hn}`);
        results.push({ status: 'mapped', db_home: dbMatch.team_a, api_home: f.teams.home.name, flipped, externalId });
      }
    }

    // ── PASADA 2: timestamp para TBD (equipos sin nombre aún en DB) ──────────
    for (const f of unmapped) {
      const externalId = String(f.fixture.id);
      const kickoff = new Date(f.fixture.date);
      const hn = norm(toES(f.teams.home.name));
      const an = norm(toES(f.teams.away.name));

      const candidates = dbMatches.filter(m => {
        if (m.external_id && m.external_id !== externalId) return false;
        const diff = Math.abs(new Date(m.scheduled_at).getTime() - kickoff.getTime());
        return diff < 5 * 60000;
      });

      let dbMatch = null, flipped = false;

      if (candidates.length === 1) {
        const c = candidates[0];
        const na = norm(c.team_a), nb = norm(c.team_b);
        const isTBD = c.team_a?.startsWith('TBD') || c.team_b?.startsWith('TBD');
        const normalMatch   = na === hn && nb === an;
        const reversedMatch = na === an && nb === hn;
        if (isTBD || normalMatch || reversedMatch) {
          dbMatch = c;
          flipped = reversedMatch && !normalMatch;
        }
      } else if (candidates.length > 1) {
        let c = candidates.find(m => norm(m.team_a) === hn && norm(m.team_b) === an);
        if (c) { dbMatch = c; flipped = false; }
        else {
          c = candidates.find(m => norm(m.team_a) === an && norm(m.team_b) === hn);
          if (c) { dbMatch = c; flipped = true; }
        }
      }

      if (!dbMatch) {
        notFound++;
        results.push({
          status: 'not_found',
          api_home: f.teams.home.name, api_away: f.teams.away.name,
          searched_home_es: toES(f.teams.home.name),
          searched_away_es: toES(f.teams.away.name),
          date: f.fixture.date,
          candidates: candidates.map(m => ({ ta: m.team_a, tb: m.team_b })),
        });
        continue;
      }

      const updatePayload = { external_id: externalId };
      if (!dbMatch.team_a || dbMatch.team_a.startsWith('TBD')) {
        updatePayload.team_a = flipped ? toES(f.teams.away.name) : toES(f.teams.home.name);
      }
      if (!dbMatch.team_b || dbMatch.team_b.startsWith('TBD')) {
        updatePayload.team_b = flipped ? toES(f.teams.home.name) : toES(f.teams.away.name);
      }

      const { error: ue } = await supabase.from('matches').update(updatePayload).eq('id', dbMatch.id);
      if (ue) {
        results.push({ status: 'error', id: dbMatch.id, error: ue.message });
      } else {
        mapped++;
        dbMatch.external_id = externalId;
        results.push({ status: 'mapped_by_time', db_home: dbMatch.team_a, api_home: f.teams.home.name, flipped, externalId });
      }
    }

    return Response.json({
      success: true,
      summary: { total_api: fixtures.length, mapped, alreadyMapped, notFound },
      details: results,
    });
  } catch (e) {
    console.error('map-fixtures error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

async function fetchAPI(endpoint) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`https://v3.football.api-sports.io${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

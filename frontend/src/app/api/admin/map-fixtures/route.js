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
  'Cape Verde Islands':'Cabo Verde','Türkiye':'Turquía',
  'Bosnia & Herzegovina':'Bosnia y Herzegovina',
};

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

    let mapped = 0, alreadyMapped = 0, notFound = 0;
    const results = [];

    for (const f of fixtures) {
      const externalId = String(f.fixture.id);
      const kickoff   = new Date(f.fixture.date);
      const hc = f.teams.home.code;   // home code según API
      const ac = f.teams.away.code;   // away code según API
      const homeName = TEAM_NAME_ES[f.teams.home.name] || f.teams.home.name;
      const awayName = TEAM_NAME_ES[f.teams.away.name] || f.teams.away.name;

      // 1. Orientación normal: API home = DB team_a, API away = DB team_b
      let dbMatch = dbMatches.find(m =>
        m.team_a_code === hc && m.team_b_code === ac
      );
      let flipped = false;

      // 2. Orientación invertida: API home = DB team_b, API away = DB team_a
      if (!dbMatch) {
        const rev = dbMatches.find(m =>
          m.team_a_code === ac && m.team_b_code === hc
        );
        if (rev) { dbMatch = rev; flipped = true; }
      }

      // 3. Timestamp ±5 min + desambiguación con ambas orientaciones
      if (!dbMatch) {
        const candidates = dbMatches.filter(m => {
          const diff = Math.abs(new Date(m.scheduled_at).getTime() - kickoff.getTime());
          return diff < 5 * 60000;
        });

        if (candidates.length === 1) {
          dbMatch = candidates[0];
          // Detectar orientación por código si están disponibles
          if (dbMatch.team_a_code && dbMatch.team_b_code) {
            flipped = (dbMatch.team_a_code === ac && dbMatch.team_b_code === hc);
          }
        } else if (candidates.length > 1) {
          // Normal
          let found = candidates.find(m => m.team_a_code === hc && m.team_b_code === ac);
          if (found) { dbMatch = found; flipped = false; }
          else {
            // Invertida
            found = candidates.find(m => m.team_a_code === ac && m.team_b_code === hc);
            if (found) { dbMatch = found; flipped = true; }
          }
          // Último recurso: estadio
          if (!dbMatch && f.fixture.venue?.name) {
            const venue = f.fixture.venue.name.split(' ')[0].toLowerCase();
            dbMatch = candidates.find(m =>
              m.stadium && m.stadium.toLowerCase().includes(venue)
            ) || null;
          }
        }
      }

      if (!dbMatch) {
        notFound++;
        results.push({
          status: 'not_found',
          api_home: f.teams.home.name, api_away: f.teams.away.name,
          date: f.fixture.date,
        });
        continue;
      }

      if (dbMatch.external_id === externalId) {
        alreadyMapped++;
        continue;
      }

      const updatePayload = { external_id: externalId };
      // Solo sobreescribir nombres TBD usando la orientación correcta
      if (!dbMatch.team_a || dbMatch.team_a.startsWith('TBD')) {
        updatePayload.team_a = flipped ? awayName : homeName;
        updatePayload.team_a_code = flipped ? ac : hc;
      }
      if (!dbMatch.team_b || dbMatch.team_b.startsWith('TBD')) {
        updatePayload.team_b = flipped ? homeName : awayName;
        updatePayload.team_b_code = flipped ? hc : ac;
      }

      const { error: updateErr } = await supabase
        .from('matches').update(updatePayload).eq('id', dbMatch.id);

      if (updateErr) {
        results.push({ status: 'error', id: dbMatch.id, error: updateErr.message });
      } else {
        mapped++;
        dbMatch.external_id = externalId; // marcar como usado en cache local
        results.push({
          status: 'mapped',
          db_home: dbMatch.team_a, api_home: f.teams.home.name,
          flipped, externalId,
        });
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

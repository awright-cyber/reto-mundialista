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

    // Índices para búsqueda eficiente (normalizados a mayúsculas y sin espacios)
    const byCodeNormal   = new Map(); // "HOMEcode|AWAYcode" → dbMatch
    const byCodeReversed = new Map(); // "AWAYcode|HOMEcode" → dbMatch (orientación invertida)
    for (const m of dbMatches) {
      const a = (m.team_a_code || '').trim().toUpperCase();
      const b = (m.team_b_code || '').trim().toUpperCase();
      if (a && b && a !== 'TBD' && b !== 'TBD') {
        byCodeNormal.set(`${a}|${b}`, m);
        byCodeReversed.set(`${b}|${a}`, m); // mismo partido, orden inverso
      }
    }

    const results = [];
    let mapped = 0, alreadyMapped = 0;
    const unmapped = []; // fixtures que no se resolvieron por código

    // ── PASADA 1: mapeo por código FIFA (orden independiente) ─────────────────
    for (const f of fixtures) {
      const externalId = String(f.fixture.id);
      const hc = (f.teams.home.code || '').trim().toUpperCase();
      const ac = (f.teams.away.code || '').trim().toUpperCase();
      if (!hc || !ac) { unmapped.push(f); continue; }

      // Buscar en orientación normal o invertida
      const dbMatch = byCodeNormal.get(`${hc}|${ac}`)
                   || byCodeReversed.get(`${hc}|${ac}`);

      if (!dbMatch) { unmapped.push(f); continue; }

      const flipped = !!byCodeReversed.get(`${hc}|${ac}`) && !byCodeNormal.get(`${hc}|${ac}`);

      if (dbMatch.external_id === externalId) {
        alreadyMapped++;
        // Eliminar del índice para que no lo use otro fixture
        byCodeNormal.delete(`${hc}|${ac}`);
        byCodeReversed.delete(`${hc}|${ac}`);
        continue;
      }

      const homeName = TEAM_NAME_ES[f.teams.home.name] || f.teams.home.name;
      const awayName = TEAM_NAME_ES[f.teams.away.name] || f.teams.away.name;
      const updatePayload = { external_id: externalId };
      if (!dbMatch.team_a || dbMatch.team_a.startsWith('TBD')) {
        updatePayload.team_a = flipped ? awayName : homeName;
        updatePayload.team_a_code = flipped ? ac : hc;
      }
      if (!dbMatch.team_b || dbMatch.team_b.startsWith('TBD')) {
        updatePayload.team_b = flipped ? homeName : awayName;
        updatePayload.team_b_code = flipped ? hc : ac;
      }

      const { error: ue } = await supabase.from('matches').update(updatePayload).eq('id', dbMatch.id);
      if (ue) {
        results.push({ status: 'error', id: dbMatch.id, error: ue.message });
      } else {
        mapped++;
        dbMatch.external_id = externalId;
        results.push({ status: 'mapped', db_home: dbMatch.team_a, api_home: f.teams.home.name, flipped, externalId });
      }
      // Retirar del índice para evitar doble uso
      byCodeNormal.delete(`${hc}|${ac}`);
      byCodeReversed.delete(`${hc}|${ac}`);
    }

    // ── PASADA 2: timestamp para lo que quedó sin mapear por código ───────────
    // Solo aplica a partidos con equipos TBD en la DB
    let notFound = 0;
    for (const f of unmapped) {
      const externalId = String(f.fixture.id);
      const kickoff = new Date(f.fixture.date);
      const hc = (f.teams.home.code || '').trim().toUpperCase();
      const ac = (f.teams.away.code || '').trim().toUpperCase();

      const candidates = dbMatches.filter(m => {
        if (m.external_id) return false; // ya mapeado
        const diff = Math.abs(new Date(m.scheduled_at).getTime() - kickoff.getTime());
        return diff < 5 * 60000;
      });

      let dbMatch = null, flipped = false;

      if (candidates.length === 1) {
        const c = candidates[0];
        // Solo usar si los códigos son TBD (caso legítimo) o realmente coinciden
        const isTBD = !c.team_a_code || c.team_a_code === 'TBD';
        const normalMatch   = c.team_a_code?.toUpperCase() === hc && c.team_b_code?.toUpperCase() === ac;
        const reversedMatch = c.team_a_code?.toUpperCase() === ac && c.team_b_code?.toUpperCase() === hc;
        if (isTBD || normalMatch || reversedMatch) {
          dbMatch = c;
          flipped = reversedMatch;
        }
      } else if (candidates.length > 1) {
        let found = candidates.find(m => m.team_a_code?.toUpperCase() === hc && m.team_b_code?.toUpperCase() === ac);
        if (found) { dbMatch = found; flipped = false; }
        else {
          found = candidates.find(m => m.team_a_code?.toUpperCase() === ac && m.team_b_code?.toUpperCase() === hc);
          if (found) { dbMatch = found; flipped = true; }
        }
        if (!dbMatch && f.fixture.venue?.name) {
          const venue = f.fixture.venue.name.split(' ')[0].toLowerCase();
          dbMatch = candidates.find(m => m.stadium?.toLowerCase().includes(venue)) || null;
        }
      }

      if (!dbMatch) {
        notFound++;
        // Info de diagnóstico: qué códigos buscamos y qué hay en la DB a esa hora
        const nearby = dbMatches
          .filter(m => Math.abs(new Date(m.scheduled_at).getTime() - kickoff.getTime()) < 10 * 60000)
          .map(m => ({ ta_code: m.team_a_code, tb_code: m.team_b_code, ext: m.external_id || null }));
        results.push({
          status: 'not_found',
          api_home: f.teams.home.name, api_away: f.teams.away.name,
          searched_hc: hc, searched_ac: ac,
          date: f.fixture.date,
          nearby_db_matches: nearby,
        });
        continue;
      }

      const homeName = TEAM_NAME_ES[f.teams.home.name] || f.teams.home.name;
      const awayName = TEAM_NAME_ES[f.teams.away.name] || f.teams.away.name;
      const updatePayload = { external_id: externalId };
      if (!dbMatch.team_a || dbMatch.team_a.startsWith('TBD')) {
        updatePayload.team_a = flipped ? awayName : homeName;
        updatePayload.team_a_code = flipped ? ac : hc;
      }
      if (!dbMatch.team_b || dbMatch.team_b.startsWith('TBD')) {
        updatePayload.team_b = flipped ? homeName : awayName;
        updatePayload.team_b_code = flipped ? hc : ac;
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

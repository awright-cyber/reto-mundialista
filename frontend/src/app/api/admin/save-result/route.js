// POST /api/admin/save-result
// Body: { secret, match_id, score_a, score_b, went_to_penalties?, winner_side? }
// went_to_penalties: bool — true si el partido se definió en penales
// winner_side: 'a' | 'b' — requerido si empate o penales; auto-calculado si hay ganador claro

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Llave del torneo: match_number → { next, slot }
// slot 'a' = el ganador va como team_a del siguiente partido
// slot 'b' = el ganador va como team_b del siguiente partido
// loser_next / loser_slot = solo semifinales (perdedor va al tercer lugar)
const BRACKET = {
  73:{next:89,slot:'a'},  74:{next:90,slot:'a'},
  75:{next:89,slot:'b'},  76:{next:90,slot:'b'},
  77:{next:91,slot:'a'},  78:{next:92,slot:'a'},
  79:{next:91,slot:'b'},  80:{next:92,slot:'b'},
  81:{next:93,slot:'a'},  82:{next:94,slot:'a'},
  83:{next:93,slot:'b'},  84:{next:94,slot:'b'},
  85:{next:95,slot:'a'},  86:{next:96,slot:'a'},
  87:{next:95,slot:'b'},  88:{next:96,slot:'b'},
  89:{next:97,slot:'a'},  90:{next:97,slot:'b'},
  91:{next:98,slot:'a'},  92:{next:98,slot:'b'},
  93:{next:99,slot:'a'},  94:{next:99,slot:'b'},
  95:{next:100,slot:'a'}, 96:{next:100,slot:'b'},
  97:{next:101,slot:'a'}, 98:{next:101,slot:'b'},
  99:{next:102,slot:'a'}, 100:{next:102,slot:'b'},
  101:{next:104,slot:'a',loser_next:103,loser_slot:'a'},
  102:{next:104,slot:'b',loser_next:103,loser_slot:'b'},
};

async function propagate(matchNumber, winner, loser) {
  const entry = BRACKET[matchNumber];
  if (!entry) return { propagated: false };

  // Buscar siguiente partido por match_number
  const { data: nextMatch } = await supabase
    .from('matches')
    .select('id')
    .eq('match_number', entry.next)
    .single();

  if (nextMatch) {
    const update = entry.slot === 'a'
      ? { team_a: winner.team, team_a_code: winner.code }
      : { team_b: winner.team, team_b_code: winner.code };
    await supabase.from('matches')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', nextMatch.id);
  }

  // Semifinalistas: perdedor va al tercer lugar
  if (entry.loser_next && loser) {
    const { data: thirdMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('match_number', entry.loser_next)
      .single();
    if (thirdMatch) {
      const loserUpdate = entry.loser_slot === 'a'
        ? { team_a: loser.team, team_a_code: loser.code }
        : { team_b: loser.team, team_b_code: loser.code };
      await supabase.from('matches')
        .update({ ...loserUpdate, updated_at: new Date().toISOString() })
        .eq('id', thirdMatch.id);
    }
  }

  return { propagated: true, nextMatch: entry.next };
}

export async function POST(request) {
  try {
    const { secret, match_id, score_a, score_b, went_to_penalties, winner_side } = await request.json();

    if (secret !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!match_id || score_a === undefined || score_b === undefined) {
      return Response.json({ error: 'Faltan campos: match_id, score_a, score_b' }, { status: 400 });
    }

    const sa = parseInt(score_a);
    const sb = parseInt(score_b);
    if (isNaN(sa) || isNaN(sb) || sa < 0 || sb < 0) {
      return Response.json({ error: 'score_a y score_b deben ser números >= 0' }, { status: 400 });
    }

    // Obtener datos del partido
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id,match_number,phase,team_a,team_b,team_a_code,team_b_code')
      .eq('id', match_id)
      .single();
    if (matchErr || !match) return Response.json({ error: 'Partido no encontrado' }, { status: 404 });

    // Determinar ganador
    let winSide = winner_side; // 'a' | 'b' | null
    if (!winSide) {
      if (sa > sb) winSide = 'a';
      else if (sb > sa) winSide = 'b';
    }

    // Para fases eliminatorias con empate sin winner_side: error
    if (match.phase !== 'grupos' && sa === sb && !winSide) {
      return Response.json({ error: 'Empate en fase eliminatoria: debes indicar quién ganó en penales.' }, { status: 400 });
    }

    const winnerCode = winSide === 'a' ? match.team_a_code : winSide === 'b' ? match.team_b_code : null;

    // Guardar resultado
    const { error: updateErr } = await supabase
      .from('matches')
      .update({
        score_a: sa,
        score_b: sb,
        status: 'finished',
        went_to_penalties: went_to_penalties || false,
        winner_code: winnerCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id);

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

    // Calcular puntos
    const { error: pointsErr } = await supabase.rpc('calculate_match_points', { p_match_id: match_id });
    if (pointsErr) return Response.json({ error: 'Resultado guardado pero error en puntos: ' + pointsErr.message }, { status: 500 });

    const { error: lbErr } = await supabase.rpc('recalculate_leaderboard');
    if (lbErr) return Response.json({ error: 'Puntos calculados pero error en ranking: ' + lbErr.message }, { status: 500 });

    // Propagar llave (solo fases eliminatorias)
    let propagateResult = { propagated: false };
    if (match.phase !== 'grupos' && winSide) {
      const winner = winSide === 'a'
        ? { team: match.team_a, code: match.team_a_code }
        : { team: match.team_b, code: match.team_b_code };
      const loser = winSide === 'a'
        ? { team: match.team_b, code: match.team_b_code }
        : { team: match.team_a, code: match.team_a_code };
      propagateResult = await propagate(match.match_number, winner, loser);
    }

    return Response.json({
      success: true,
      message: 'Resultado guardado, puntos calculados y ranking actualizado',
      ...propagateResult,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

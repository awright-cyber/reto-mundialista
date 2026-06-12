// POST /api/admin/recalculate-all
// Recalcula puntos de TODOS los partidos finalizados y reconstruye el ranking.
// Útil cuando el trigger bloqueó cálculos previos o para corregir datos.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { secret } = await request.json();
    if (secret !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: finishedMatches, error: fetchError } = await supabase
      .from('matches')
      .select('id, team_a, team_b, match_number')
      .eq('status', 'finished')
      .order('match_number', { ascending: true });

    if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
    if (!finishedMatches?.length) {
      return Response.json({ success: true, message: 'No hay partidos finalizados', recalculated: 0 });
    }

    let recalculated = 0;
    const errors = [];

    for (const match of finishedMatches) {
      const { error } = await supabase.rpc('calculate_match_points', { p_match_id: match.id });
      if (error) {
        errors.push(`${match.team_a} vs ${match.team_b}: ${error.message}`);
      } else {
        recalculated++;
      }
    }

    const { error: lbError } = await supabase.rpc('recalculate_leaderboard');
    if (lbError) errors.push(`Leaderboard: ${lbError.message}`);

    return Response.json({
      success: errors.length === 0,
      recalculated,
      total: finishedMatches.length,
      errors: errors.length ? errors : undefined,
      message: `${recalculated}/${finishedMatches.length} partidos recalculados. Ranking actualizado.`
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

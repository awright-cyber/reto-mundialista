// POST /api/admin/recalculate-all
// Recalcula puntos de TODOS los partidos finalizados y reconstruye el ranking.
// Ejecuta calculate_match_points en paralelo para evitar timeouts.

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

    // Ejecución en paralelo — de ~24s secuencial a ~2s
    const settled = await Promise.allSettled(
      finishedMatches.map(match =>
        supabase.rpc('calculate_match_points', { p_match_id: match.id })
          .then(({ error }) => ({ match, error }))
      )
    );

    let recalculated = 0;
    const errors = [];

    for (const r of settled) {
      if (r.status === 'rejected') {
        errors.push(`Excepción inesperada: ${r.reason}`);
      } else {
        const { match, error } = r.value;
        if (error) {
          errors.push(`${match.team_a} vs ${match.team_b} (#${match.match_number}): ${error.message}`);
        } else {
          recalculated++;
        }
      }
    }

    const { error: lbError } = await supabase.rpc('recalculate_leaderboard');
    if (lbError) errors.push(`Leaderboard: ${lbError.message}`);

    const allOk = errors.length === 0;
    return Response.json({
      success: allOk,
      recalculated,
      total: finishedMatches.length,
      errors: errors.length ? errors : undefined,
      message: allOk
        ? `✅ ${recalculated}/${finishedMatches.length} partidos recalculados. Ranking actualizado.`
        : `⚠️ ${recalculated}/${finishedMatches.length} ok. Errores: ${errors.join(' | ')}`,
    }, { status: allOk ? 200 : 207 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

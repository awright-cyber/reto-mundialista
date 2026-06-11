// POST /api/admin/save-result
// Body: { secret, match_id, score_a, score_b }
// Usa SUPABASE_SERVICE_KEY para bypassear RLS en tabla matches

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { secret, match_id, score_a, score_b } = await request.json();

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

    const { error: updateErr } = await supabase
      .from('matches')
      .update({ score_a: sa, score_b: sb, status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', match_id);

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

    const { error: pointsErr } = await supabase.rpc('calculate_match_points', { p_match_id: match_id });
    if (pointsErr) return Response.json({ error: 'Resultado guardado pero error en puntos: ' + pointsErr.message }, { status: 500 });

    const { error: lbErr } = await supabase.rpc('recalculate_leaderboard');
    if (lbErr) return Response.json({ error: 'Puntos calculados pero error en ranking: ' + lbErr.message }, { status: 500 });

    return Response.json({ success: true, message: 'Resultado guardado, puntos calculados y ranking actualizado' });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

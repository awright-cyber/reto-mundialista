// POST /api/admin/update-teams
// Body: { secret, match_id, team_a, team_b, team_a_flag, team_b_flag }
// Actualiza los nombres y banderas de los equipos de un partido (fase eliminatoria)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { secret, match_id, team_a, team_b, team_a_flag, team_b_flag } = await request.json();

    if (secret !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!match_id || !team_a || !team_b) {
      return Response.json({ error: 'Faltan campos: match_id, team_a, team_b' }, { status: 400 });
    }

    const { error } = await supabase
      .from('matches')
      .update({
        team_a: team_a.trim(),
        team_b: team_b.trim(),
        team_a_flag: team_a_flag?.trim() || null,
        team_b_flag: team_b_flag?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, message: 'Equipos actualizados' });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

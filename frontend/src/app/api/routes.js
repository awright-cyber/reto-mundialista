// ============================================================
// API ROUTES — Next.js 14 App Router
// Todos los endpoints del backend
// ============================================================

// ── /api/auth/register ──────────────────────────────────────
// POST: Registro de nuevo usuario
// Archivo: src/app/api/auth/register/route.js

export async function POST_register(request) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const body = await request.json();
    const { fullName, cedula, phone, email, city, birthDate, acceptsTerms, acceptsMarketing, password } = body;

    // Validaciones
    if (!acceptsTerms) {
      return Response.json({ error: 'Debes aceptar los términos y condiciones' }, { status: 400 });
    }
    if (!cedula || cedula.length < 8) {
      return Response.json({ error: 'Cédula o pasaporte inválido' }, { status: 400 });
    }

    // Verificar cédula única
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('cedula', cedula)
      .single();

    if (existing) {
      return Response.json({ error: 'Esta cédula ya está registrada' }, { status: 409 });
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-8) + 'X1!',
      email_confirm: true
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    // Crear perfil en tabla users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        full_name: fullName,
        cedula,
        phone,
        email,
        city,
        birth_date: birthDate,
        accepts_terms: true,
        accepts_marketing: acceptsMarketing || false
      })
      .select()
      .single();

    if (userError) {
      return Response.json({ error: userError.message }, { status: 400 });
    }

    // Crear entrada en leaderboard
    await supabase.from('leaderboard').insert({ user_id: user.id });

    // Achievement: día uno
    const { data: dayOneAchievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('code', 'day_one')
      .single();

    const signupDate = new Date().toISOString().split('T')[0];
    if (dayOneAchievement && signupDate === '2026-06-11') {
      await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: dayOneAchievement.id
      });
    }

    return Response.json({ success: true, userId: user.id });
  } catch (error) {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ── /api/predictions ────────────────────────────────────────
// POST: Guardar predicciones de un usuario
// GET:  Obtener predicciones del usuario autenticado

export async function POST_predictions(request, { userId }) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const body = await request.json();
  const { predictions, specialPredictions } = body;

  // Verificar bloqueo global
  const lockDate = new Date(process.env.PREDICTIONS_LOCK_DATE);
  if (new Date() > lockDate) {
    return Response.json({ error: 'Las predicciones están cerradas' }, { status: 403 });
  }

  // Verificar si el usuario ya envió
  const { data: user } = await supabase
    .from('users')
    .select('predictions_locked')
    .eq('id', userId)
    .single();

  if (user?.predictions_locked) {
    return Response.json({ error: 'Tus predicciones ya fueron enviadas' }, { status: 403 });
  }

  // Insertar predicciones (upsert)
  const predRows = predictions.map(p => ({
    user_id: userId,
    match_id: p.matchId,
    predicted_score_a: p.scoreA,
    predicted_score_b: p.scoreB
  }));

  const { error: predError } = await supabase
    .from('predictions')
    .upsert(predRows, { onConflict: 'user_id,match_id' });

  if (predError) {
    return Response.json({ error: predError.message }, { status: 400 });
  }

  // Insertar predicciones especiales
  if (specialPredictions) {
    await supabase.from('special_predictions').upsert({
      user_id: userId,
      ...specialPredictions
    }, { onConflict: 'user_id' });
  }

  return Response.json({ success: true, locked: false });
}

export async function POST_lock_predictions(request, { userId }) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Confirmar envío definitivo
  await supabase
    .from('users')
    .update({
      predictions_locked: true,
      predictions_submitted_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Achievement: todas las predicciones
  const { data: allPredsAchievement } = await supabase
    .from('achievements').select('id').eq('code', 'all_predictions').single();

  const { count } = await supabase
    .from('predictions').select('id', { count: 'exact' }).eq('user_id', userId);

  if (count >= 104 && allPredsAchievement) {
    await supabase.from('user_achievements').upsert({
      user_id: userId,
      achievement_id: allPredsAchievement.id
    }, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });
  }

  return Response.json({ success: true, locked: true });
}

// ── /api/admin/results ──────────────────────────────────────
// PUT: Actualizar resultado de un partido (manual admin)
export async function PUT_admin_result(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { matchId, scoreA, scoreB, wentToPenalties, winnerCode } = await request.json();

  await supabase.from('matches').update({
    score_a: scoreA,
    score_b: scoreB,
    status: 'finished',
    went_to_penalties: wentToPenalties || false,
    winner_code: winnerCode || null,
    updated_at: new Date().toISOString()
  }).eq('id', matchId);

  // Calcular puntos
  await supabase.rpc('calculate_match_points', { p_match_id: matchId });
  // Recalcular ranking
  await supabase.rpc('recalculate_leaderboard');

  return Response.json({ success: true });
}

// ── /api/admin/export ───────────────────────────────────────
// GET: Exportar usuarios o predicciones en CSV
export async function GET_admin_export(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'users' | 'predictions'

  if (type === 'users') {
    const { data } = await supabase
      .from('users')
      .select('full_name,cedula,phone,email,city,birth_date,accepts_marketing,total_points,global_rank,created_at')
      .order('global_rank', { ascending: true });

    const csv = [
      'Nombre,Cédula,Teléfono,Email,Ciudad,Nacimiento,Marketing,Puntos,Ranking,Registro',
      ...(data || []).map(u =>
        `"${u.full_name}","${u.cedula}","${u.phone}","${u.email}","${u.city}","${u.birth_date}","${u.accepts_marketing}","${u.total_points}","${u.global_rank}","${u.created_at}"`
      )
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="usuarios_reto_mundial.csv"'
      }
    });
  }

  if (type === 'predictions') {
    const { data } = await supabase
      .from('predictions')
      .select('users(full_name,email),matches(team_a,team_b,match_number),predicted_score_a,predicted_score_b,points_earned,exact_score');

    const csv = [
      'Usuario,Email,Partido,Predicción,Puntos,Exacto',
      ...(data || []).map(p =>
        `"${p.users.full_name}","${p.users.email}","${p.matches.team_a} vs ${p.matches.team_b}","${p.predicted_score_a}-${p.predicted_score_b}","${p.points_earned}","${p.exact_score}"`
      )
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="predicciones_reto_mundial.csv"'
      }
    });
  }

  return Response.json({ error: 'Tipo inválido. Usar ?type=users o ?type=predictions' }, { status: 400 });
}

// ── /api/cron/sync-results ──────────────────────────────────
// GET: Llamado por Vercel Cron cada 5 minutos
export async function GET_cron_sync(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { syncWorldCupResults } = require('../../../backend/src/jobs/syncResults');
  const result = await syncWorldCupResults();
  return Response.json(result);
}

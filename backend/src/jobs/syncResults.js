// ============================================================
// SERVICIO DE SINCRONIZACIÓN AUTOMÁTICA DE RESULTADOS
// Archivo: /backend/src/jobs/syncResults.js
//
// Usa API-Football (RapidAPI) — el mejor servicio para datos
// del Mundial en tiempo real. Plan gratuito: 100 req/día.
// Plan básico ($10/mes): ilimitado para el Mundial 2026.
//
// Configurar en: https://rapidapi.com/api-sports/api/api-football
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key (solo backend)
);

// ID del Mundial 2026 en API-Football (confirmar en lanzamiento)
const WORLD_CUP_2026_ID = 1; // actualizar cuando se confirme

// ============================================================
// FUNCIÓN PRINCIPAL: Sincronizar todos los partidos activos
// Se llama desde Vercel Cron cada 5 minutos durante el Mundial
// ============================================================
async function syncWorldCupResults() {
  console.log(`[${new Date().toISOString()}] Iniciando sync de resultados...`);

  try {
    // 1. Obtener partidos del día (live + recently finished)
    const liveMatches = await fetchLiveMatches();
    const finishedMatches = await fetchTodayFinishedMatches();

    const allMatches = [...liveMatches, ...finishedMatches];

    if (allMatches.length === 0) {
      console.log('No hay partidos activos hoy.');
      return { updated: 0 };
    }

    let updatedCount = 0;

    for (const apiMatch of allMatches) {
      const updated = await processMatch(apiMatch);
      if (updated) updatedCount++;
    }

    // 2. Si hubo actualizaciones, recalcular ranking
    if (updatedCount > 0) {
      console.log(`Actualizados ${updatedCount} partidos. Recalculando ranking...`);
      await supabase.rpc('recalculate_leaderboard');
      await generateNotifications();
      console.log('Ranking recalculado.');
    }

    return { updated: updatedCount };

  } catch (error) {
    console.error('Error en sync:', error);
    throw error;
  }
}

// ============================================================
// Obtener partidos EN VIVO de API-Football
// ============================================================
async function fetchLiveMatches() {
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?live=all&league=${WORLD_CUP_2026_ID}&season=2026`,
    {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    }
  );

  if (!response.ok) throw new Error(`API-Football error: ${response.status}`);
  const data = await response.json();
  return data.response || [];
}

// ============================================================
// Obtener partidos FINALIZADOS hoy
// ============================================================
async function fetchTodayFinishedMatches() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${WORLD_CUP_2026_ID}&season=2026&date=${today}&status=FT`,
    {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    }
  );

  if (!response.ok) throw new Error(`API-Football error: ${response.status}`);
  const data = await response.json();
  return data.response || [];
}

// ============================================================
// Procesar un partido individual
// ============================================================
async function processMatch(apiMatch) {
  const fixture = apiMatch.fixture;
  const goals = apiMatch.goals;
  const teams = apiMatch.teams;

  // Mapear status de API-Football a nuestro sistema
  const statusMap = {
    'NS': 'pending',   // Not Started
    '1H': 'live',     // First Half
     'HT': 'live',    // Half Time
    '2H': 'live',     // Second Half
    'ET': 'live',     // Extra Time
    'P': 'live',      // Penalty
    'FT': 'finished', // Full Time
    'AET': 'finished',// After Extra Time
    'PEN': 'finished',// After Penalty
    'CANC': 'cancelled'
  };

  const ourStatus = statusMap[fixture.status.short] || 'pending';

  // Buscar partido en nuestra BD por external_id
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, score_a, score_b')
    .eq('external_id', String(fixture.id))
    .single();

  if (!match) {
    // Partido no encontrado — puede ser que el external_id no esté mapeado aún
    console.warn(`Partido no encontrado: ${fixture.id} (${teams.home.name} vs ${teams.away.name})`);
    return false;
  }

  // Si el status y score son iguales, no actualizar
  if (
    match.status === ourStatus &&
    match.score_a === goals.home &&
    match.score_b === goals.away
  ) {
    return false;
  }

  // Determinar si fue a penales
  const wentToPenalties = fixture.status.short === 'PEN';
  const penScore = apiMatch.score?.penalty;

  // Determinar equipo clasificado
  let winnerCode = null;
  if (ourStatus === 'finished') {
    if (wentToPenalties) {
      winnerCode = penScore?.home > penScore?.away
        ? teams.home.code
        : teams.away.code;
    } else if (goals.home > goals.away) {
      winnerCode = teams.home.code;
    } else if (goals.away > goals.home) {
      winnerCode = teams.away.code;
    }
    // null = empate en fase de grupos
  }

  // Actualizar partido en nuestra BD
  const { error } = await supabase
    .from('matches')
    .update({
      status: ourStatus,
      score_a: goals.home,
      score_b: goals.away,
      went_to_penalties: wentToPenalties,
      penalty_score_a: penScore?.home || null,
      penalty_score_b: penScore?.away || null,
      winner_code: winnerCode,
      updated_at: new Date().toISOString()
    })
    .eq('id', match.id);

  if (error) {
    console.error(`Error actualizando partido ${match.id}:`, error);
    return false;
  }

  // Si el partido terminó, calcular puntos
  if (ourStatus === 'finished' && match.status !== 'finished') {
    console.log(`Partido finalizado: ${teams.home.name} ${goals.home}-${goals.away} ${teams.away.name}. Calculando puntos...`);
    await supabase.rpc('calculate_match_points', { p_match_id: match.id });
  }

  return true;
}

// ============================================================
// Generar notificaciones para usuarios afectados
// ============================================================
async function generateNotifications() {
  // Obtener predicciones que acaban de ser calculadas (últimas 10 min)
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: recentPredictions } = await supabase
    .from('predictions')
    .select(`
      user_id, points_earned, exact_score,
      matches (team_a, team_b, team_a_flag, team_b_flag, score_a, score_b)
    `)
    .gt('calculated_at', tenMinsAgo)
    .gt('points_earned', 0);

  if (!recentPredictions?.length) return;

  // Crear notificaciones en batch
  const notifications = recentPredictions.map(pred => ({
    user_id: pred.user_id,
    type: 'points_earned',
    title: pred.exact_score
      ? `⚡ ¡Marcador exacto! +${pred.points_earned} puntos`
      : `✅ Ganaste +${pred.points_earned} puntos`,
    body: `${pred.matches.team_a_flag} ${pred.matches.team_a} ${pred.matches.score_a}-${pred.matches.score_b} ${pred.matches.team_b_flag} ${pred.matches.team_b}`,
    data: { points: pred.points_earned, exact: pred.exact_score }
  }));

  await supabase.from('notifications').insert(notifications);
}

// ============================================================
// ENDPOINT HTTP para Vercel Cron
// Archivo: /frontend/src/app/api/cron/sync-results/route.js
// ============================================================
// Este archivo se usaría así en Next.js:
//
// export async function GET(request) {
//   // Verificar que viene de Vercel Cron (seguridad)
//   const authHeader = request.headers.get('authorization');
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return Response.json({ error: 'Unauthorized' }, { status: 401 });
//   }
//   const result = await syncWorldCupResults();
//   return Response.json(result);
// }

module.exports = { syncWorldCupResults };

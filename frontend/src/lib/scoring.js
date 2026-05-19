// lib/scoring.js
// Motor de puntuación — lógica de negocio pura
// Esta misma lógica se refleja en la función SQL calculate_match_points()

/**
 * Calcula los puntos de una predicción
 * @param {Object} prediction - { predA, predB } — marcador predicho
 * @param {Object} result - { scoreA, scoreB } — resultado real
 * @returns {Object} - desglose de puntos
 */
export function calculatePoints(prediction, result) {
  const { predA, predB } = prediction;
  const { scoreA, scoreB } = result;

  // Validación
  if (predA === null || predA === undefined || predB === null || predB === undefined) {
    return { total: 0, breakdown: [] };
  }
  if (scoreA === null || scoreA === undefined || scoreB === null || scoreB === undefined) {
    return { total: 0, breakdown: [], pending: true };
  }

  const breakdown = [];
  let total = 0;

  // ── Marcador exacto (5 pts) ──────────────────────────────
  if (predA === scoreA && predB === scoreB) {
    return {
      total: 5,
      breakdown: [{ type: 'exact_score', pts: 5, label: '⚡ Marcador exacto' }],
      exactScore: true
    };
  }

  // ── Resultado (ganador/empate) — 3 pts ───────────────────
  const predWinner = predA > predB ? 'A' : predA < predB ? 'B' : 'X';
  const realWinner = scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'X';

  if (predWinner === realWinner) {
    total += 3;
    breakdown.push({ type: 'correct_result', pts: 3, label: '✅ Ganador/empate correcto' });
  }

  // ── Diferencia de goles — 2 pts ──────────────────────────
  if ((predA - predB) === (scoreA - scoreB)) {
    total += 2;
    breakdown.push({ type: 'correct_diff', pts: 2, label: '📊 Diferencia de goles' });
  } else {
    // ── Goles exactos por equipo — 1 pt cada uno ────────────
    if (predA === scoreA) {
      total += 1;
      breakdown.push({ type: 'team_a_goals', pts: 1, label: '🎯 Goles equipo A exactos' });
    }
    if (predB === scoreB) {
      total += 1;
      breakdown.push({ type: 'team_b_goals', pts: 1, label: '🎯 Goles equipo B exactos' });
    }
  }

  // Máximo siempre 5 pts
  total = Math.min(total, 5);

  return {
    total,
    breakdown,
    exactScore: false,
    correctResult: predWinner === realWinner
  };
}

/**
 * Calcular puntos bonus especiales
 */
export function calculateBonusPoints({
  champion, predictedChampion,
  runnerUp, predictedRunnerUp,
  thirdPlace, predictedThirdPlace,
  topScorer, predictedTopScorer,
  revelation, predictedRevelation,
  ecuadorPhase // 'groups' | 'round_of_16' | 'quarterfinals' | 'semifinals' | 'final' | 'eliminated'
}) {
  let total = 0;
  const breakdown = [];

  const check = (real, predicted, pts, label, bonus) => {
    if (real && predicted && real.toLowerCase() === predicted.toLowerCase()) {
      total += pts;
      breakdown.push({ type: bonus, pts, label });
    }
  };

  check(champion, predictedChampion, 20, '🏆 Campeón del Mundial', 'bonus_champion');
  check(runnerUp, predictedRunnerUp, 15, '🥈 Subcampeón', 'bonus_runner_up');
  check(thirdPlace, predictedThirdPlace, 10, '🥉 Tercer lugar', 'bonus_third_place');
  check(topScorer, predictedTopScorer, 10, '⚽ Goleador del torneo', 'bonus_top_scorer');
  check(revelation, predictedRevelation, 5, '⭐ Equipo revelación', 'bonus_revelation');

  // Ecuador — puntos acumulativos por cada fase superada
  const phases = ['groups', 'round_of_16', 'quarterfinals', 'semifinals'];
  const phaseOrder = { groups: 0, round_of_16: 1, quarterfinals: 2, semifinals: 3, final: 4 };
  const ecuadorReached = phaseOrder[ecuadorPhase] ?? -1;

  phases.forEach(phase => {
    if (ecuadorReached >= phaseOrder[phase]) {
      total += 5;
      breakdown.push({
        type: `bonus_ecuador_${phase}`,
        pts: 5,
        label: `🇪🇨 Ecuador → ${phase.replace('_', ' ')}`
      });
    }
  });

  return { total, breakdown };
}

/**
 * Obtener mensaje motivacional según puntos ganados
 */
export function getMotivationalMessage(pts, isExact = false) {
  if (isExact) return '🔮 ¡ORÁCULO! ¡Marcador exacto!';
  if (pts === 5) return '⚡ ¡PERFECTO! Máximo puntaje';
  if (pts === 4) return '🔥 ¡Casi perfecto! Excelente predicción';
  if (pts === 3) return '✅ ¡Bien! Acertaste el resultado';
  if (pts === 2) return '📊 Acertaste la diferencia';
  if (pts === 1) return '🎯 Parcialmente correcto';
  return '😔 Esta vez no, ¡sigue intentando!';
}

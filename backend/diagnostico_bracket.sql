-- DIAGNÓSTICO DEL BRACKET — Ejecutar ANTES de aplicar correcciones
-- Supabase Dashboard → SQL Editor

-- 1. Estado actual de Ronda de 32 (esperado: TBD-1A, TBD-2B, etc.)
SELECT match_number, team_a, team_b
FROM matches
WHERE phase = 'round_of_32'
ORDER BY match_number;

-- 2. Estado actual de Octavos (esperado: TBD-R32-W1, TBD-R32-W3, etc. DESPUÉS del fix)
SELECT match_number, team_a, team_b
FROM matches
WHERE phase = 'round_of_16'
ORDER BY match_number;

-- 3. Detectar nombres de equipos duplicados en la fase de grupos
-- (un mismo nombre no debería aparecer en más de un grupo)
SELECT team_a AS team, COUNT(DISTINCT group_name) AS n_grupos
FROM matches WHERE phase = 'grupos'
GROUP BY team_a HAVING COUNT(DISTINCT group_name) > 1
UNION ALL
SELECT team_b AS team, COUNT(DISTINCT group_name) AS n_grupos
FROM matches WHERE phase = 'grupos'
GROUP BY team_b HAVING COUNT(DISTINCT group_name) > 1;
-- Si este query devuelve filas, hay equipos en más de un grupo → bug de datos

-- 4. Detectar claves TBD repetidas en Ronda de 32
-- (ningún TBD-1X o TBD-2X debería aparecer en más de un partido de R32)
SELECT team_a AS tbd_key, COUNT(*) AS veces
FROM matches WHERE phase = 'round_of_32'
GROUP BY team_a HAVING COUNT(*) > 1
UNION ALL
SELECT team_b AS tbd_key, COUNT(*) AS veces
FROM matches WHERE phase = 'round_of_32'
GROUP BY team_b HAVING COUNT(*) > 1;
-- Si devuelve filas, el mismo equipo aparece en dos partidos de R32 → duplicación garantizada en Octavos

-- 5. Verificar que fix_round_of_32 fue aplicado correctamente
-- (todos los R32 deben usar claves TBD-1X / TBD-2Y / TBD-WX)
SELECT match_number, team_a, team_b,
  CASE
    WHEN team_a LIKE 'TBD-%' AND team_b LIKE 'TBD-%' THEN 'OK'
    ELSE 'PROBLEMA: equipo con nombre real en R32'
  END AS estado
FROM matches
WHERE phase = 'round_of_32'
ORDER BY match_number;

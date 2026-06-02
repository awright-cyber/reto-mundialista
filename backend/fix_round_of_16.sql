-- Fix Round of 16 (Octavos) bracket pairings
-- Problema: el bracket anterior emparejaba ganadores del mismo "pod" de grupos,
-- permitiendo que dos equipos del mismo grupo se enfrenten en Octavos.
--
-- Estructura de pods en Ronda de 32:
--   Pod AB: M73 (1A vs 2B) + M74 (1B vs 2A)  → R32-W1, R32-W2
--   Pod CD: M75 (1C vs 2D) + M76 (1D vs 2C)  → R32-W3, R32-W4
--   Pod EF: M77 (1E vs 2F) + M78 (1F vs 2E)  → R32-W5, R32-W6
--   Pod GH: M79 (1G vs 2H) + M80 (1H vs 2G)  → R32-W7, R32-W8
--   Pod IJ: M81 (1I vs 2J) + M82 (1J vs 2I)  → R32-W9, R32-W10
--   Pod KL: M83 (1K vs 2L) + M84 (1L vs 2K)  → R32-W11, R32-W12
--   Terceros: M85-M88                          → R32-W13..W16
--
-- Fix: cruzar pods en Octavos (AB+CD, EF+GH, IJ+KL, terceros+terceros)
-- Garantía: ningún equipo del mismo grupo puede cruzarse antes de Cuartos.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor

UPDATE matches SET team_a = 'TBD-R32-W1',  team_b = 'TBD-R32-W3'  WHERE match_number = 89;
UPDATE matches SET team_a = 'TBD-R32-W2',  team_b = 'TBD-R32-W4'  WHERE match_number = 90;
UPDATE matches SET team_a = 'TBD-R32-W5',  team_b = 'TBD-R32-W7'  WHERE match_number = 91;
UPDATE matches SET team_a = 'TBD-R32-W6',  team_b = 'TBD-R32-W8'  WHERE match_number = 92;
UPDATE matches SET team_a = 'TBD-R32-W9',  team_b = 'TBD-R32-W11' WHERE match_number = 93;
UPDATE matches SET team_a = 'TBD-R32-W10', team_b = 'TBD-R32-W12' WHERE match_number = 94;
UPDATE matches SET team_a = 'TBD-R32-W13', team_b = 'TBD-R32-W15' WHERE match_number = 95;
UPDATE matches SET team_a = 'TBD-R32-W14', team_b = 'TBD-R32-W16' WHERE match_number = 96;

-- Verificar resultado
SELECT match_number, team_a, team_b FROM matches
WHERE phase = 'round_of_16'
ORDER BY match_number;

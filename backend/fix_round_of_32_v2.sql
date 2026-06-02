-- Fix Ronda de 32: estructura FIFA correcta
-- Los 8 mejores primeros vs los 8 mejores terceros
-- Los 4 peores primeros vs los 4 mejores segundos
-- Los 8 peores segundos entre sí
--
-- Las claves TBD-F1..F12, TBD-S1..S12, TBD-W1..W8 se resuelven
-- dinámicamente en el frontend según las predicciones de fase de grupos.
-- F1 = mejor 1° (más pts/gd/gf entre los 12 ganadores de grupo)
-- S1 = mejor 2°, W1 = mejor 3°
--
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- 8 mejores 1°s vs 8 mejores 3°s
UPDATE matches SET team_a = 'TBD-F1',  team_b = 'TBD-W1'  WHERE match_number = 73;
UPDATE matches SET team_a = 'TBD-F2',  team_b = 'TBD-W2'  WHERE match_number = 74;
UPDATE matches SET team_a = 'TBD-F3',  team_b = 'TBD-W3'  WHERE match_number = 75;
UPDATE matches SET team_a = 'TBD-F4',  team_b = 'TBD-W4'  WHERE match_number = 76;
UPDATE matches SET team_a = 'TBD-F5',  team_b = 'TBD-W5'  WHERE match_number = 77;
UPDATE matches SET team_a = 'TBD-F6',  team_b = 'TBD-W6'  WHERE match_number = 78;
UPDATE matches SET team_a = 'TBD-F7',  team_b = 'TBD-W7'  WHERE match_number = 79;
UPDATE matches SET team_a = 'TBD-F8',  team_b = 'TBD-W8'  WHERE match_number = 80;

-- 4 peores 1°s vs 4 mejores 2°s
UPDATE matches SET team_a = 'TBD-F9',  team_b = 'TBD-S1'  WHERE match_number = 81;
UPDATE matches SET team_a = 'TBD-F10', team_b = 'TBD-S2'  WHERE match_number = 82;
UPDATE matches SET team_a = 'TBD-F11', team_b = 'TBD-S3'  WHERE match_number = 83;
UPDATE matches SET team_a = 'TBD-F12', team_b = 'TBD-S4'  WHERE match_number = 84;

-- 8 peores 2°s entre sí
UPDATE matches SET team_a = 'TBD-S5',  team_b = 'TBD-S6'  WHERE match_number = 85;
UPDATE matches SET team_a = 'TBD-S7',  team_b = 'TBD-S8'  WHERE match_number = 86;
UPDATE matches SET team_a = 'TBD-S9',  team_b = 'TBD-S10' WHERE match_number = 87;
UPDATE matches SET team_a = 'TBD-S11', team_b = 'TBD-S12' WHERE match_number = 88;

-- Verificar
SELECT match_number, team_a, team_b FROM matches
WHERE phase = 'round_of_32'
ORDER BY match_number;

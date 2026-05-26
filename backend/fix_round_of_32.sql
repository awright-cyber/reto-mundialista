-- Fix round_of_32 matches to use TBD-* bracket keys instead of hardcoded team names
-- Run this in Supabase SQL Editor
-- Based on matches_104.csv rows 73-88

UPDATE matches SET team_a = 'TBD-1A', team_b = 'TBD-2B', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 73;
UPDATE matches SET team_a = 'TBD-1B', team_b = 'TBD-2A', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 74;
UPDATE matches SET team_a = 'TBD-1C', team_b = 'TBD-2D', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 75;
UPDATE matches SET team_a = 'TBD-1D', team_b = 'TBD-2C', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 76;
UPDATE matches SET team_a = 'TBD-1E', team_b = 'TBD-2F', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 77;
UPDATE matches SET team_a = 'TBD-1F', team_b = 'TBD-2E', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 78;
UPDATE matches SET team_a = 'TBD-1G', team_b = 'TBD-2H', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 79;
UPDATE matches SET team_a = 'TBD-1H', team_b = 'TBD-2G', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 80;
UPDATE matches SET team_a = 'TBD-1I', team_b = 'TBD-2J', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 81;
UPDATE matches SET team_a = 'TBD-1J', team_b = 'TBD-2I', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 82;
UPDATE matches SET team_a = 'TBD-1K', team_b = 'TBD-2L', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 83;
UPDATE matches SET team_a = 'TBD-1L', team_b = 'TBD-2K', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 84;
UPDATE matches SET team_a = 'TBD-W1', team_b = 'TBD-W2', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 85;
UPDATE matches SET team_a = 'TBD-W3', team_b = 'TBD-W4', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 86;
UPDATE matches SET team_a = 'TBD-W5', team_b = 'TBD-W6', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 87;
UPDATE matches SET team_a = 'TBD-W7', team_b = 'TBD-W8', team_a_code = 'TBD', team_b_code = 'TBD' WHERE match_number = 88;

-- Verify the fix
SELECT match_number, team_a, team_b FROM matches WHERE phase = 'round_of_32' ORDER BY match_number;

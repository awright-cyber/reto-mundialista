-- ============================================================
-- RETO MUNDIALISTA — PLAZA LAS AMÉRICAS
-- Schema SQL para Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- para cron jobs internos

-- ============================================================
-- TABLA: users (participantes)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- vinculado a Supabase Auth
  full_name TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  birth_date DATE NOT NULL,
  accepts_terms BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_marketing BOOLEAN DEFAULT FALSE,
  predictions_locked BOOLEAN DEFAULT FALSE,
  predictions_submitted_at TIMESTAMPTZ,
  total_points INTEGER DEFAULT 0,
  global_rank INTEGER,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: matches (104 partidos del Mundial 2026)
-- ============================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE, -- ID de API-Football para sync automático
  phase TEXT NOT NULL CHECK (phase IN (
    'grupos','round_of_32','round_of_16','quarterfinals',
    'semifinals','third_place','final'
  )),
  group_name TEXT, -- 'Grupo A', 'Grupo B', etc.
  match_number INTEGER, -- 1..104
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  team_a_flag TEXT, -- emoji bandera
  team_b_flag TEXT,
  team_a_code TEXT, -- 'BRA', 'ECU', etc.
  team_b_code TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL, -- fecha/hora UTC
  stadium TEXT,
  city TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','live','finished','cancelled'
  )),
  -- Resultado oficial (pre-penales en fases eliminatorias)
  score_a INTEGER,
  score_b INTEGER,
  -- En fases eliminatorias: equipo que avanzó
  winner_code TEXT,
  -- Si fue a penales
  went_to_penalties BOOLEAN DEFAULT FALSE,
  penalty_score_a INTEGER,
  penalty_score_b INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: predictions (predicciones por partido)
-- ============================================================
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_score_a INTEGER NOT NULL CHECK (predicted_score_a >= 0),
  predicted_score_b INTEGER NOT NULL CHECK (predicted_score_b >= 0),
  -- Resultado calculado
  points_earned INTEGER DEFAULT 0,
  exact_score BOOLEAN DEFAULT FALSE,
  correct_result BOOLEAN DEFAULT FALSE,
  correct_diff BOOLEAN DEFAULT FALSE,
  correct_team_a_goals BOOLEAN DEFAULT FALSE,
  correct_team_b_goals BOOLEAN DEFAULT FALSE,
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- ============================================================
-- TABLA: special_predictions (predicciones especiales)
-- ============================================================
CREATE TABLE special_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  champion_team TEXT,
  runner_up_team TEXT,
  third_place_team TEXT,
  top_scorer_player TEXT,
  revelation_team TEXT,
  ecuador_prediction TEXT CHECK (ecuador_prediction IN (
    'groups','round_of_16','quarterfinals','semifinals','final'
  )),
  -- Puntos ganados por cada predicción especial
  pts_champion INTEGER DEFAULT 0,
  pts_runner_up INTEGER DEFAULT 0,
  pts_third_place INTEGER DEFAULT 0,
  pts_top_scorer INTEGER DEFAULT 0,
  pts_revelation INTEGER DEFAULT 0,
  pts_ecuador INTEGER DEFAULT 0,
  -- Estado del Mundial para calcular bonus Ecuador
  ecuador_groups_ok BOOLEAN DEFAULT FALSE,
  ecuador_r16_ok BOOLEAN DEFAULT FALSE,
  ecuador_qf_ok BOOLEAN DEFAULT FALSE,
  ecuador_sf_ok BOOLEAN DEFAULT FALSE,
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: leaderboard (calculado/cacheado para performance)
-- ============================================================
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  match_points INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  global_rank INTEGER,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0, -- positivo = subió
  exact_scores INTEGER DEFAULT 0,
  correct_results INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  accuracy_pct DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: achievements (logros/badges)
-- ============================================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji
  condition_type TEXT NOT NULL, -- 'exact_scores','streak','rank','registration', etc.
  condition_value INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- TABLA: promotions (Plaza Las Américas)
-- ============================================================
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  store_name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'food','sports','entertainment','fashion'
  emoji TEXT,
  discount_text TEXT,
  qr_code TEXT, -- URL o código QR
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  min_rank_required INTEGER, -- null = todos; 1-100 = solo top 100
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: notifications (historial de notificaciones)
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'points_earned','rank_change','achievement','match_result'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: scoring_rules (configuración de puntaje — editable)
-- ============================================================
CREATE TABLE scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar reglas base
INSERT INTO scoring_rules (code, description, points) VALUES
  ('exact_score', 'Marcador exacto', 5),
  ('correct_result', 'Ganador o empate correcto', 3),
  ('correct_diff', 'Diferencia de goles correcta', 2),
  ('correct_team_goals', 'Goles exactos de un equipo', 1);

-- ============================================================
-- TABLA: achievements base
-- ============================================================
INSERT INTO achievements (code, name, description, icon, condition_type, condition_value) VALUES
  ('first_prediction', 'Primer gol', 'Enviaste tu primera predicción', '⚽', 'predictions_count', 1),
  ('all_predictions', 'Reto completo', 'Predijiste los 104 partidos', '📋', 'predictions_count', 104),
  ('exact_5', 'Francotirador', '5 marcadores exactos', '🎯', 'exact_scores', 5),
  ('exact_10', 'Adivino', '10 marcadores exactos', '🌟', 'exact_scores', 10),
  ('exact_20', 'Oráculo', '20 marcadores exactos', '🔮', 'exact_scores', 20),
  ('streak_3', 'En racha', '3 aciertos consecutivos', '🔥', 'streak', 3),
  ('streak_7', 'Imparable', '7 aciertos consecutivos', '⚡', 'streak', 7),
  ('top_100', 'Elite', 'Llegar al top 100', '💎', 'rank', 100),
  ('top_10', 'Leyenda', 'Llegar al top 10', '👑', 'rank', 10),
  ('day_one', 'Pionero', 'Registrado el primer día', '🚀', 'registration', 1);

-- ============================================================
-- VISTAS útiles
-- ============================================================

-- Vista: ranking completo con datos de usuario
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT 
  l.global_rank,
  l.previous_rank,
  l.rank_change,
  l.total_points,
  l.exact_scores,
  l.correct_results,
  l.accuracy_pct,
  l.current_streak,
  u.full_name,
  u.city,
  u.id as user_id
FROM leaderboard l
JOIN users u ON l.user_id = u.id
ORDER BY l.global_rank ASC NULLS LAST;

-- Vista: mis predicciones con resultado y puntos
CREATE OR REPLACE VIEW v_user_predictions AS
SELECT
  p.user_id,
  p.predicted_score_a,
  p.predicted_score_b,
  p.points_earned,
  p.exact_score,
  p.correct_result,
  m.team_a,
  m.team_b,
  m.team_a_flag,
  m.team_b_flag,
  m.score_a as real_score_a,
  m.score_b as real_score_b,
  m.phase,
  m.group_name,
  m.scheduled_at,
  m.status,
  m.stadium
FROM predictions p
JOIN matches m ON p.match_id = m.id
ORDER BY m.scheduled_at ASC;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — seguridad por usuario
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: solo ven su propio perfil
CREATE POLICY "users_own" ON users
  FOR ALL USING (auth.uid() = auth_id);

-- Predictions: solo ven/editan las suyas
CREATE POLICY "predictions_own" ON predictions
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Special predictions: solo las suyas
CREATE POLICY "special_preds_own" ON special_predictions
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Leaderboard: público (lectura)
CREATE POLICY "leaderboard_read" ON leaderboard
  FOR SELECT USING (TRUE);

-- Matches: público (lectura)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_read" ON matches
  FOR SELECT USING (TRUE);

-- ============================================================
-- FUNCIÓN: Calcular puntos de un partido
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_match_points(
  p_match_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_pred predictions%ROWTYPE;
  v_pts INTEGER;
  v_exact BOOLEAN;
  v_result BOOLEAN;
  v_diff BOOLEAN;
  v_goals_a BOOLEAN;
  v_goals_b BOOLEAN;
  v_pred_winner TEXT;
  v_real_winner TEXT;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id AND status = 'finished';
  IF NOT FOUND THEN RETURN 0; END IF;

  FOR v_pred IN 
    SELECT * FROM predictions WHERE match_id = p_match_id
  LOOP
    v_pts := 0;
    v_exact := FALSE; v_result := FALSE; v_diff := FALSE;
    v_goals_a := FALSE; v_goals_b := FALSE;

    -- Marcador exacto: 5 puntos
    IF v_pred.predicted_score_a = v_match.score_a 
       AND v_pred.predicted_score_b = v_match.score_b THEN
      v_pts := 5; v_exact := TRUE;
    ELSE
      -- Determinar ganador predicción
      v_pred_winner := CASE 
        WHEN v_pred.predicted_score_a > v_pred.predicted_score_b THEN 'A'
        WHEN v_pred.predicted_score_a < v_pred.predicted_score_b THEN 'B'
        ELSE 'X' END;
      -- Determinar ganador real
      v_real_winner := CASE 
        WHEN v_match.score_a > v_match.score_b THEN 'A'
        WHEN v_match.score_a < v_match.score_b THEN 'B'
        ELSE 'X' END;

      -- Acertar resultado (3 pts)
      IF v_pred_winner = v_real_winner THEN
        v_pts := v_pts + 3; v_result := TRUE;
      END IF;
      -- Diferencia de goles (2 pts)
      IF (v_pred.predicted_score_a - v_pred.predicted_score_b) = 
         (v_match.score_a - v_match.score_b) THEN
        v_pts := v_pts + 2; v_diff := TRUE;
      ELSE
        -- Goles exactos por equipo (1 pt cada uno)
        IF v_pred.predicted_score_a = v_match.score_a THEN
          v_pts := v_pts + 1; v_goals_a := TRUE;
        END IF;
        IF v_pred.predicted_score_b = v_match.score_b THEN
          v_pts := v_pts + 1; v_goals_b := TRUE;
        END IF;
      END IF;

      -- Máximo 5 puntos
      v_pts := LEAST(v_pts, 5);
    END IF;

    -- Actualizar predicción
    UPDATE predictions SET
      points_earned = v_pts,
      exact_score = v_exact,
      correct_result = v_result,
      correct_diff = v_diff,
      correct_team_a_goals = v_goals_a,
      correct_team_b_goals = v_goals_b,
      calculated_at = NOW()
    WHERE id = v_pred.id;
  END LOOP;

  RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: Recalcular leaderboard completo
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_leaderboard() RETURNS VOID AS $$
BEGIN
  -- Actualizar puntos totales en leaderboard
  INSERT INTO leaderboard (user_id, total_points, match_points, bonus_points,
    exact_scores, correct_results, total_predictions, accuracy_pct)
  SELECT
    u.id,
    COALESCE(SUM(p.points_earned), 0),
    COALESCE(SUM(p.points_earned), 0),
    0,
    COALESCE(SUM(CASE WHEN p.exact_score THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.correct_result THEN 1 ELSE 0 END), 0),
    COALESCE(COUNT(p.id), 0),
    CASE WHEN COUNT(p.id) > 0
      THEN ROUND(100.0 * SUM(CASE WHEN p.correct_result OR p.exact_score THEN 1 ELSE 0 END) / COUNT(p.id), 2)
      ELSE 0 END
  FROM users u
  LEFT JOIN predictions p ON p.user_id = u.id AND p.calculated_at IS NOT NULL
  GROUP BY u.id
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    match_points = EXCLUDED.match_points,
    bonus_points = EXCLUDED.bonus_points,
    exact_scores = EXCLUDED.exact_scores,
    correct_results = EXCLUDED.correct_results,
    total_predictions = EXCLUDED.total_predictions,
    accuracy_pct = EXCLUDED.accuracy_pct,
    last_calculated = NOW();

  -- Guardar rank anterior y calcular nuevo
  UPDATE leaderboard SET previous_rank = global_rank;

  WITH ranked AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC, exact_scores DESC) as new_rank
    FROM leaderboard
  )
  UPDATE leaderboard l SET
    global_rank = r.new_rank,
    rank_change = COALESCE(l.previous_rank, r.new_rank) - r.new_rank
  FROM ranked r WHERE l.user_id = r.user_id;

  -- Actualizar rank en tabla users
  UPDATE users u SET 
    total_points = l.total_points,
    global_rank = l.global_rank
  FROM leaderboard l WHERE l.user_id = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: bloquear predicciones después del 10 de junio 2026
-- ============================================================
CREATE OR REPLACE FUNCTION check_predictions_lock() RETURNS TRIGGER AS $$
BEGIN
  -- Bloqueo global: 10 de junio 2026 23:59 hora Ecuador (UTC-5 = Jun 11 04:59 UTC)
  IF NOW() > '2026-06-11 04:59:00+00'::TIMESTAMPTZ THEN
    RAISE EXCEPTION 'Las predicciones están cerradas';
  END IF;
  -- Bloqueo individual: usuario ya envió
  IF EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id AND predictions_locked = TRUE) THEN
    RAISE EXCEPTION 'Tus predicciones ya fueron enviadas y no pueden editarse';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_predictions_lock
  BEFORE INSERT OR UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION check_predictions_lock();

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(global_rank);
CREATE INDEX idx_matches_phase ON matches(phase);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

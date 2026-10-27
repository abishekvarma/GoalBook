-- Project Physique 40 PostgreSQL schema. API also creates these tables automatically.
CREATE TABLE IF NOT EXISTS physique_app_state (
  session_id UUID PRIMARY KEY, state JSONB NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS physique_food_logs (
  session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE, meal TEXT,
  item_name TEXT, calories NUMERIC, protein NUMERIC, carbs NUMERIC, fat NUMERIC,
  entry JSONB NOT NULL, PRIMARY KEY(session_id, entry_id)
);
CREATE INDEX IF NOT EXISTS idx_physique_food_date ON physique_food_logs(session_id, entry_date);
CREATE TABLE IF NOT EXISTS physique_saved_recipes (
  session_id UUID NOT NULL, recipe_id TEXT NOT NULL, recipe_name TEXT,
  recipe JSONB NOT NULL, PRIMARY KEY(session_id, recipe_id)
);
CREATE TABLE IF NOT EXISTS physique_weight_logs (
  session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE, weight NUMERIC,
  entry JSONB NOT NULL, PRIMARY KEY(session_id, entry_id)
);
CREATE TABLE IF NOT EXISTS physique_workout_logs (
  session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE,
  workout JSONB NOT NULL, PRIMARY KEY(session_id, entry_id)
);
CREATE TABLE IF NOT EXISTS physique_photo_logs (
  session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE,
  photo JSONB NOT NULL, PRIMARY KEY(session_id, entry_id)
);
CREATE TABLE IF NOT EXISTS physique_exercise_logs (
  session_id UUID NOT NULL, entry_id TEXT NOT NULL, exercise JSONB NOT NULL,
  PRIMARY KEY(session_id, entry_id)
);
CREATE TABLE IF NOT EXISTS physique_app_settings (
  session_id UUID PRIMARY KEY, settings JSONB NOT NULL,
  transformation JSONB NOT NULL DEFAULT '{}'::jsonb,
  workout_sessions JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

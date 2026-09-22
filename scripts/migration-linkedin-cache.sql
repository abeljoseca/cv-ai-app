-- LinkedIn profiles cache
-- Shared cache across all users to minimize Bright Data API costs.
-- Keyed by normalized linkedin_url (UNIQUE); no per-user key.

CREATE TABLE IF NOT EXISTS linkedin_profiles_cache (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_url text        NOT NULL UNIQUE,
  raw_data     jsonb,
  scraped_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS linkedin_profiles_cache_url_idx
  ON linkedin_profiles_cache (linkedin_url);

-- RLS: only service role can read/write (accessed exclusively via admin client)
ALTER TABLE linkedin_profiles_cache ENABLE ROW LEVEL SECURITY;
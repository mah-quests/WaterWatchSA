-- WaterWatch SA — PostgreSQL Schema
-- Run: psql -U postgres -d waterwatch_sa -f schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  phone          VARCHAR(20),
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'citizen'
                   CHECK (role IN ('citizen', 'municipal', 'admin')),
  province       VARCHAR(100),
  municipality   VARCHAR(100),
  suburb         VARCHAR(150),
  street_address TEXT,
  postal_code    VARCHAR(10),
  language       VARCHAR(10)  DEFAULT 'en',
  alert_sms      BOOLEAN      DEFAULT TRUE,
  alert_email    BOOLEAN      DEFAULT TRUE,
  alert_push     BOOLEAN      DEFAULT FALSE,
  is_verified    BOOLEAN      DEFAULT FALSE,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Outages ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outages (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by           UUID         REFERENCES users(id) ON DELETE SET NULL,
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  status                VARCHAR(20)  NOT NULL DEFAULT 'reported'
                          CHECK (status IN ('reported','investigating','in_progress','resolved')),
  severity              VARCHAR(20)  DEFAULT 'medium'
                          CHECK (severity IN ('low','medium','high','critical')),
  province              VARCHAR(100),
  municipality          VARCHAR(100),
  suburb                VARCHAR(150),
  address               TEXT,
  lat                   DECIMAL(10,7),
  lng                   DECIMAL(10,7),
  estimated_resolution  TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  affected_count        INTEGER      DEFAULT 0,
  cause                 TEXT,
  created_at            TIMESTAMPTZ  DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outages_status   ON outages(status);
CREATE INDEX IF NOT EXISTS idx_outages_province ON outages(province);
CREATE INDEX IF NOT EXISTS idx_outages_severity ON outages(severity);

-- ── Outage updates (municipal response log) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS outage_updates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  outage_id      UUID        NOT NULL REFERENCES outages(id) ON DELETE CASCADE,
  posted_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  message        TEXT        NOT NULL,
  status_change  VARCHAR(20),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outage_updates_outage ON outage_updates(outage_id);

-- ── Water quality ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_quality (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
  province       VARCHAR(100),
  municipality   VARCHAR(100),
  suburb         VARCHAR(150),
  status         VARCHAR(20)  NOT NULL DEFAULT 'normal'
                   CHECK (status IN ('normal','caution','unsafe','no_supply')),
  turbidity      DECIMAL(8,3),
  ph             DECIMAL(5,3),
  chlorine       DECIMAL(8,4),
  notes          TEXT,
  source         VARCHAR(50)  DEFAULT 'citizen',
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_quality_province ON water_quality(province);
CREATE INDEX IF NOT EXISTS idx_water_quality_status   ON water_quality(status);

-- ── Trigger: auto-update updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_outages_updated_at
  BEFORE UPDATE ON outages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

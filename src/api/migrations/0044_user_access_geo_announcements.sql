-- Geolocalización de accesos + anuncios patrocinados por estado/provincia

CREATE TABLE IF NOT EXISTS user_access_events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  role TEXT,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  country_code TEXT,
  state TEXT,
  city TEXT,
  isp TEXT,
  risk_score INTEGER,
  is_vpn INTEGER NOT NULL DEFAULT 0,
  ipquery_json TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_access_events_user ON user_access_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_events_created ON user_access_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_access_events_state ON user_access_events(state);
CREATE INDEX IF NOT EXISTS idx_user_access_events_event ON user_access_events(event_type);

ALTER TABLE created_users ADD COLUMN last_access_country TEXT;
ALTER TABLE created_users ADD COLUMN last_access_state TEXT;
ALTER TABLE created_users ADD COLUMN last_access_city TEXT;
ALTER TABLE created_users ADD COLUMN last_access_at TEXT;

CREATE TABLE IF NOT EXISTS advertisers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS location_announcements (
  id TEXT PRIMARY KEY NOT NULL,
  advertiser_id TEXT NOT NULL REFERENCES advertisers(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_country TEXT NOT NULL,
  target_state TEXT NOT NULL,
  external_url TEXT NOT NULL,
  promo_code TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Ver más',
  banner_image_url TEXT,
  price_paid REAL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_location_announcements_status ON location_announcements(status);
CREATE INDEX IF NOT EXISTS idx_location_announcements_geo ON location_announcements(target_country, target_state);

CREATE TABLE IF NOT EXISTS announcement_interests (
  id TEXT PRIMARY KEY NOT NULL,
  announcement_id TEXT NOT NULL REFERENCES location_announcements(id),
  user_id TEXT NOT NULL,
  user_state TEXT,
  user_country TEXT,
  user_name TEXT,
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'interested',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcement_interests_ann ON announcement_interests(announcement_id);

CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id TEXT PRIMARY KEY NOT NULL,
  announcement_id TEXT NOT NULL REFERENCES location_announcements(id),
  user_id TEXT NOT NULL,
  dismissed_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_announcement_dismissals_unique ON announcement_dismissals(announcement_id, user_id);

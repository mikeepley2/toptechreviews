CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  vendor TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'outbound',
  path TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  affiliate_network TEXT NOT NULL DEFAULT '',
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clicks_site_received ON clicks(site, received_at);
CREATE INDEX IF NOT EXISTS idx_clicks_category_vendor ON clicks(category, vendor);

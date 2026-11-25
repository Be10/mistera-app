-- MISTERA V34: private progress per 192-bit pairing code hash.
CREATE TABLE IF NOT EXISTS gift_progress (
  user_hash TEXT NOT NULL,
  day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 25),
  field TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_hash,day,field)
);
CREATE INDEX IF NOT EXISTS gift_progress_user ON gift_progress(user_hash);

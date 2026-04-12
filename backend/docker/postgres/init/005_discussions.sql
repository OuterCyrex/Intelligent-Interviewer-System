CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(160) NOT NULL,
  content text NOT NULL,
  summary text NOT NULL,
  user_id uuid NOT NULL,
  author_account varchar(64) NOT NULL,
  author_name varchar(120) NOT NULL,
  tag varchar(40) NOT NULL DEFAULT '讨论',
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE discussions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS author_account varchar(64);
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS author_name varchar(120);

CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);

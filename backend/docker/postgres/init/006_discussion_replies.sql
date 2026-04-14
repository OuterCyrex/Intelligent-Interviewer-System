CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid NOT NULL,
  author_account varchar(64) NOT NULL,
  author_name varchar(120) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id_created_at
ON discussion_replies(discussion_id, created_at ASC);

UPDATE discussions AS discussion
SET reply_count = counts.reply_total
FROM (
  SELECT item.id, COUNT(reply.id)::int AS reply_total
  FROM discussions AS item
  LEFT JOIN discussion_replies AS reply
    ON reply.discussion_id = item.id
  GROUP BY item.id
) AS counts
WHERE discussion.id = counts.id;

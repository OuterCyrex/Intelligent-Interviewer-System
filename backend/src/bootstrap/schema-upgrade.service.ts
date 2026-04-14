import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class SchemaUpgradeService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    // Keep startup resilient for existing DB volumes where init SQL files were not replayed.
    await this.ensureUsersSchema();
    await this.ensureDiscussionsSchema();
  }

  private async ensureUsersSchema() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          account varchar(64) NOT NULL UNIQUE,
          password_hash varchar(255) NOT NULL,
          user_name varchar(120) NOT NULL,
          city varchar(80) NOT NULL DEFAULT '',
          age integer NULL,
          target_role varchar(120) NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash varchar(64) NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          last_used_at timestamptz NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Schema upgrade check failed: ${message}`);
    }
  }

  private async ensureDiscussionsSchema() {
    try {
      await this.dataSource.query(`
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
      `);

      await this.dataSource.query(`
        ALTER TABLE discussions ADD COLUMN IF NOT EXISTS user_id uuid;
      `);

      await this.dataSource.query(`
        ALTER TABLE discussions ADD COLUMN IF NOT EXISTS author_account varchar(64);
      `);

      await this.dataSource.query(`
        ALTER TABLE discussions ADD COLUMN IF NOT EXISTS author_name varchar(120);
      `);

      await this.dataSource.query(`
        ALTER TABLE discussions ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0;
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
      `);

      await this.dataSource.query(`
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
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id_created_at
        ON discussion_replies(discussion_id, created_at ASC);
      `);

      await this.dataSource.query(`
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
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Discussions schema upgrade check failed: ${message}`);
    }
  }
}

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(64) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text NOT NULL,
  highlights text NOT NULL DEFAULT '',
  evaluation_dimensions text NOT NULL DEFAULT '',
  default_difficulty varchar(32) NOT NULL DEFAULT 'intermediate',
  default_question_count integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  type varchar(32) NOT NULL,
  difficulty varchar(32) NOT NULL,
  content text NOT NULL,
  topic varchar(120) NOT NULL,
  expected_keywords text NOT NULL DEFAULT '',
  follow_up_hints text NOT NULL DEFAULT '',
  evaluation_focus text NOT NULL DEFAULT '',
  rubric text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_questions_position_topic UNIQUE (position_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_questions_position_id ON questions(position_id);
CREATE INDEX IF NOT EXISTS idx_questions_position_active ON questions(position_id, is_active);

CREATE TABLE IF NOT EXISTS knowledge_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  title varchar(160) NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  tags text NOT NULL DEFAULT '',
  difficulty varchar(32) NOT NULL DEFAULT 'intermediate',
  embedding vector(1536) NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_knowledge_snippets_position_title UNIQUE (position_id, title)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_snippets_position_id ON knowledge_snippets(position_id);

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  candidate_name varchar(120) NOT NULL,
  mode varchar(16) NOT NULL DEFAULT 'text',
  difficulty varchar(32) NOT NULL DEFAULT 'intermediate',
  status varchar(32) NOT NULL DEFAULT 'in_progress',
  focus_areas text NOT NULL DEFAULT '',
  planned_question_ids text NOT NULL DEFAULT '',
  current_question_index integer NOT NULL DEFAULT 0,
  target_question_count integer NOT NULL DEFAULT 4,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_position_id ON interviews(position_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_name ON interviews(candidate_name);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_position_status
  ON interviews(candidate_name, position_id, status);

CREATE TABLE IF NOT EXISTS interview_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_id uuid NULL REFERENCES questions(id) ON DELETE SET NULL,
  parent_turn_id uuid NULL REFERENCES interview_turns(id) ON DELETE SET NULL,
  sequence integer NOT NULL,
  kind varchar(16) NOT NULL,
  question_type varchar(32) NULL,
  prompt text NOT NULL,
  input_mode varchar(16) NULL,
  answer_text text NULL,
  transcript text NULL,
  keyword_hits text NOT NULL DEFAULT '',
  missed_keywords text NOT NULL DEFAULT '',
  audio_metrics text NULL,
  dimension_scores text NULL,
  overall_score integer NULL,
  evaluation_summary text NULL,
  evaluation_source varchar(32) NOT NULL DEFAULT 'heuristic',
  llm_provider varchar(64) NULL,
  llm_model varchar(120) NULL,
  needs_follow_up boolean NOT NULL DEFAULT false,
  follow_up_reason text NULL,
  answered_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_turns_interview_id ON interview_turns(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_turns_interview_sequence
  ON interview_turns(interview_id, sequence);
CREATE INDEX IF NOT EXISTS idx_interview_turns_parent_turn_id ON interview_turns(parent_turn_id);

CREATE TABLE IF NOT EXISTS interview_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  technical_score integer NOT NULL,
  communication_score integer NOT NULL,
  depth_score integer NOT NULL,
  role_fit_score integer NOT NULL,
  summary text NOT NULL,
  strengths text NOT NULL DEFAULT '',
  improvement_areas text NOT NULL DEFAULT '',
  next_steps text NOT NULL DEFAULT '',
  question_type_breakdown text NULL,
  generation_source varchar(32) NOT NULL DEFAULT 'heuristic',
  llm_provider varchar(64) NULL,
  llm_model varchar(120) NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

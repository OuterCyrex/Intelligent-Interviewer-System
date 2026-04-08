import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Question } from "../questions/question.entity";
import type { QuestionType } from "../questions/question.entity";
import { InterviewSession, InterviewMode } from "./interview.entity";

export type InterviewTurnKind = "base" | "follow_up";

export interface InterviewTurnScores {
  technical: number;
  communication: number;
  depth: number;
  roleFit: number;
}

export interface InterviewAudioMetrics {
  durationSeconds: number | null;
  fillerWordCount: number;
  averageConfidence: number | null;
  averagePauseMs: number | null;
  paceWpm: number | null;
  fillerRate: number;
  clarityScore: number;
  flags: string[];
}

@Entity({ name: "interview_turns" })
export class InterviewTurn {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "interview_id", type: "uuid" })
  interviewId!: string;

  @ManyToOne(() => InterviewSession, (interview) => interview.turns, { onDelete: "CASCADE" })
  @JoinColumn({ name: "interview_id" })
  interview!: InterviewSession;

  @Column({ name: "question_id", type: "uuid", nullable: true })
  questionId!: string | null;

  @ManyToOne(() => Question, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "question_id" })
  question!: Question | null;

  @Column({ name: "parent_turn_id", type: "uuid", nullable: true })
  parentTurnId!: string | null;

  @ManyToOne(() => InterviewTurn, (turn) => turn.followUps, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "parent_turn_id" })
  parentTurn!: InterviewTurn | null;

  @OneToMany(() => InterviewTurn, (turn) => turn.parentTurn)
  followUps!: InterviewTurn[];

  @Column({ type: "int" })
  sequence!: number;

  @Column({ type: "varchar", length: 16 })
  kind!: InterviewTurnKind;

  @Column({ name: "question_type", type: "varchar", length: 32, nullable: true })
  questionType!: QuestionType | null;

  @Column({ type: "text" })
  prompt!: string;

  @Column({ name: "input_mode", type: "varchar", length: 16, nullable: true })
  inputMode!: InterviewMode | null;

  @Column({ name: "answer_text", type: "text", nullable: true })
  answerText!: string | null;

  @Column({ type: "text", nullable: true })
  transcript!: string | null;

  @Column({ name: "keyword_hits", type: "simple-array", default: "" })
  keywordHits!: string[];

  @Column({ name: "missed_keywords", type: "simple-array", default: "" })
  missedKeywords!: string[];

  @Column({ name: "audio_metrics", type: "simple-json", nullable: true })
  audioMetrics!: InterviewAudioMetrics | null;

  @Column({ name: "dimension_scores", type: "simple-json", nullable: true })
  dimensionScores!: InterviewTurnScores | null;

  @Column({ name: "overall_score", type: "int", nullable: true })
  overallScore!: number | null;

  @Column({ name: "evaluation_summary", type: "text", nullable: true })
  evaluationSummary!: string | null;

  @Column({ name: "evaluation_source", type: "varchar", length: 32, default: "heuristic" })
  evaluationSource!: "heuristic" | "llm";

  @Column({ name: "llm_provider", type: "varchar", length: 64, nullable: true })
  llmProvider!: string | null;

  @Column({ name: "llm_model", type: "varchar", length: 120, nullable: true })
  llmModel!: string | null;

  @Column({ name: "needs_follow_up", type: "boolean", default: false })
  needsFollowUp!: boolean;

  @Column({ name: "follow_up_reason", type: "text", nullable: true })
  followUpReason!: string | null;

  @Column({ name: "answered_at", type: "timestamptz", nullable: true })
  answeredAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Position } from "../positions/position.entity";
import type { QuestionDifficulty } from "../questions/question.entity";
import { InterviewReport } from "../reports/report.entity";
import { InterviewTurn } from "./interview-turn.entity";

export type InterviewMode = "text" | "speech";
export type InterviewStatus = "in_progress" | "completed";

@Entity({ name: "interviews" })
export class InterviewSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "position_id", type: "uuid" })
  positionId!: string;

  @ManyToOne(() => Position, { onDelete: "CASCADE" })
  @JoinColumn({ name: "position_id" })
  position!: Position;

  @Column({ name: "candidate_name", type: "varchar", length: 120 })
  candidateName!: string;

  @Column({ type: "varchar", length: 16, default: "text" })
  mode!: InterviewMode;

  @Column({ type: "varchar", length: 32, default: "intermediate" })
  difficulty!: QuestionDifficulty;

  @Column({ type: "varchar", length: 32, default: "in_progress" })
  status!: InterviewStatus;

  @Column({ name: "focus_areas", type: "simple-array", default: "" })
  focusAreas!: string[];

  @Column({ name: "planned_question_ids", type: "simple-array", default: "" })
  plannedQuestionIds!: string[];

  @Column({ name: "current_question_index", type: "int", default: 0 })
  currentQuestionIndex!: number;

  @Column({ name: "target_question_count", type: "int", default: 4 })
  targetQuestionCount!: number;

  @OneToMany(() => InterviewTurn, (turn) => turn.interview)
  turns!: InterviewTurn[];

  @OneToOne(() => InterviewReport, (report) => report.interview)
  report!: InterviewReport | null;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  startedAt!: Date | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

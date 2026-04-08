import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { InterviewSession } from "../interviews/interview.entity";

@Entity({ name: "interview_reports" })
export class InterviewReport {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "interview_id", type: "uuid", unique: true })
  interviewId!: string;

  @OneToOne(() => InterviewSession, (interview) => interview.report, { onDelete: "CASCADE" })
  @JoinColumn({ name: "interview_id" })
  interview!: InterviewSession;

  @Column({ name: "overall_score", type: "int" })
  overallScore!: number;

  @Column({ name: "technical_score", type: "int" })
  technicalScore!: number;

  @Column({ name: "communication_score", type: "int" })
  communicationScore!: number;

  @Column({ name: "depth_score", type: "int" })
  depthScore!: number;

  @Column({ name: "role_fit_score", type: "int" })
  roleFitScore!: number;

  @Column({ type: "text" })
  summary!: string;

  @Column({ type: "simple-array", default: "" })
  strengths!: string[];

  @Column({ name: "improvement_areas", type: "simple-array", default: "" })
  improvementAreas!: string[];

  @Column({ name: "next_steps", type: "simple-array", default: "" })
  nextSteps!: string[];

  @Column({ name: "question_type_breakdown", type: "simple-json", nullable: true })
  questionTypeBreakdown!: Record<string, number> | null;

  @Column({ name: "generation_source", type: "varchar", length: 32, default: "heuristic" })
  generationSource!: "heuristic" | "llm";

  @Column({ name: "llm_provider", type: "varchar", length: 64, nullable: true })
  llmProvider!: string | null;

  @Column({ name: "llm_model", type: "varchar", length: 120, nullable: true })
  llmModel!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

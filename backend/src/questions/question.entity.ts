import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Position } from "../positions/position.entity";

export type QuestionType = "technical" | "project" | "scenario" | "behavioral";
export type QuestionDifficulty = "junior" | "intermediate" | "senior";

@Entity({ name: "questions" })
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "position_id", type: "uuid" })
  positionId!: string;

  @ManyToOne(() => Position, (position) => position.questions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "position_id" })
  position!: Position;

  @Column({ type: "varchar", length: 32 })
  type!: QuestionType;

  @Column({ type: "varchar", length: 32 })
  difficulty!: QuestionDifficulty;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "simple-array", default: "" })
  expectedKeywords!: string[];

  @Column({ type: "text", nullable: true })
  rubric!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

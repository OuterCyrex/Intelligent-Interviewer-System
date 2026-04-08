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
import type { QuestionDifficulty } from "../questions/question.entity";

@Entity({ name: "knowledge_snippets" })
export class KnowledgeSnippet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "position_id", type: "uuid" })
  positionId!: string;

  @ManyToOne(() => Position, (position) => position.knowledgeSnippets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "position_id" })
  position!: Position;

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "text" })
  summary!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "simple-array", default: "" })
  tags!: string[];

  @Column({ type: "varchar", length: 32, default: "intermediate" })
  difficulty!: QuestionDifficulty;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

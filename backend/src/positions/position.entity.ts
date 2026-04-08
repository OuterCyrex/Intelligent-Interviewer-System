import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { KnowledgeSnippet } from "../knowledge/knowledge.entity";
import { Question } from "../questions/question.entity";
import type { QuestionDifficulty } from "../questions/question.entity";

@Entity({ name: "positions" })
export class Position {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "simple-array", default: "" })
  highlights!: string[];

  @Column({ name: "evaluation_dimensions", type: "simple-array", default: "" })
  evaluationDimensions!: string[];

  @Column({ name: "default_difficulty", type: "varchar", length: 32, default: "intermediate" })
  defaultDifficulty!: QuestionDifficulty;

  @Column({ name: "default_question_count", type: "int", default: 4 })
  defaultQuestionCount!: number;

  @OneToMany(() => Question, (question) => question.position)
  questions!: Question[];

  @OneToMany(() => KnowledgeSnippet, (snippet) => snippet.position)
  knowledgeSnippets!: KnowledgeSnippet[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

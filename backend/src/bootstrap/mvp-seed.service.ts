import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { KnowledgeSnippet } from "../knowledge/knowledge.entity";
import { Position } from "../positions/position.entity";
import { Question } from "../questions/question.entity";

interface SeedPosition {
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  evaluationDimensions: string[];
  defaultDifficulty: Question["difficulty"];
  defaultQuestionCount: number;
}

interface SeedQuestion {
  positionSlug: string;
  topic: string;
  type: Question["type"];
  difficulty: Question["difficulty"];
  content: string;
  expectedKeywords: string[];
  followUpHints: string[];
  evaluationFocus: string[];
  rubric: string;
}

interface SeedKnowledgeSnippet {
  positionSlug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  difficulty: Question["difficulty"];
}

const SEED_POSITIONS: SeedPosition[] = [
  {
    slug: "java-backend-engineer",
    name: "Java Backend Engineer",
    description: "Backend-focused mock interviews covering Java, distributed systems, data stores, and production trade-offs.",
    highlights: ["Spring Boot", "MySQL", "Redis", "message queue", "system design"],
    evaluationDimensions: ["technical correctness", "knowledge depth", "communication", "role fit"],
    defaultDifficulty: "intermediate",
    defaultQuestionCount: 4
  },
  {
    slug: "web-frontend-engineer",
    name: "Web Frontend Engineer",
    description: "Frontend-focused interviews spanning browser internals, framework engineering, performance, and debugging.",
    highlights: ["browser rendering", "Vue or React", "performance optimization", "engineering quality"],
    evaluationDimensions: ["technical correctness", "knowledge depth", "communication", "role fit"],
    defaultDifficulty: "intermediate",
    defaultQuestionCount: 4
  }
];

const SEED_QUESTIONS: SeedQuestion[] = [
  {
    positionSlug: "java-backend-engineer",
    topic: "Cache consistency",
    type: "technical",
    difficulty: "intermediate",
    content: "How would you handle cache consistency between Redis and MySQL in a high-concurrency system?",
    expectedKeywords: ["cache invalidation", "double delete", "retry", "database consistency", "hot key"],
    followUpHints: ["failure handling", "retry timing", "hot key protection"],
    evaluationFocus: ["Redis", "MySQL", "system design"],
    rubric: "Explain a concrete consistency strategy, mention failure paths, and discuss mitigation for high traffic."
  },
  {
    positionSlug: "java-backend-engineer",
    topic: "Project deep dive",
    type: "project",
    difficulty: "intermediate",
    content: "Pick a backend project you worked on and explain the architecture, the bottlenecks you hit, and how you resolved them.",
    expectedKeywords: ["architecture", "bottleneck", "metrics", "trade-off", "optimization"],
    followUpHints: ["how you measured impact", "why the chosen solution was appropriate"],
    evaluationFocus: ["system design", "communication"],
    rubric: "Look for ownership, reasoning, metrics, and the ability to connect technical choices to outcomes."
  },
  {
    positionSlug: "java-backend-engineer",
    topic: "Order spike scenario",
    type: "scenario",
    difficulty: "intermediate",
    content: "Your order service sees a sudden traffic spike and downstream dependencies start timing out. What do you do first and how do you stabilize the system?",
    expectedKeywords: ["rate limit", "degrade", "queue", "timeout", "monitoring"],
    followUpHints: ["stabilization order", "observability", "rollback strategy"],
    evaluationFocus: ["message queue", "system design"],
    rubric: "Expect prioritization, containment, observability, and a staged recovery plan."
  },
  {
    positionSlug: "java-backend-engineer",
    topic: "Cross-team communication",
    type: "behavioral",
    difficulty: "intermediate",
    content: "Tell me about a time you had to push back on a backend requirement because of reliability or scalability risk.",
    expectedKeywords: ["risk", "trade-off", "stakeholder", "communication", "outcome"],
    followUpHints: ["how you influenced the decision", "what data you used"],
    evaluationFocus: ["communication", "role fit"],
    rubric: "Expect clear context, decision criteria, and evidence of stakeholder communication."
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "Rendering pipeline",
    type: "technical",
    difficulty: "intermediate",
    content: "Walk me through how the browser turns HTML, CSS, and JavaScript into pixels on the screen, and where performance issues usually appear.",
    expectedKeywords: ["DOM", "CSSOM", "render tree", "layout", "paint"],
    followUpHints: ["reflow causes", "JavaScript impact", "performance tracing"],
    evaluationFocus: ["browser rendering", "performance optimization"],
    rubric: "Expect a clear rendering pipeline explanation and awareness of common bottlenecks."
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "Frontend project deep dive",
    type: "project",
    difficulty: "intermediate",
    content: "Choose a frontend project and explain the architecture, collaboration model, and the biggest engineering trade-off you made.",
    expectedKeywords: ["architecture", "state management", "trade-off", "collaboration", "delivery"],
    followUpHints: ["how the architecture evolved", "quality controls"],
    evaluationFocus: ["engineering quality", "communication"],
    rubric: "Look for system thinking, ownership, and how quality was balanced with delivery speed."
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "Large page slowdown",
    type: "scenario",
    difficulty: "intermediate",
    content: "A critical page becomes noticeably slower after a new release. How would you investigate and fix it?",
    expectedKeywords: ["profiling", "bundle", "waterfall", "render", "regression"],
    followUpHints: ["measurement plan", "rollback criteria", "preventing recurrence"],
    evaluationFocus: ["performance optimization", "engineering quality"],
    rubric: "Expect a hypothesis-driven debugging flow and clear rollback versus fix trade-offs."
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "Influencing product scope",
    type: "behavioral",
    difficulty: "intermediate",
    content: "Describe a time you pushed for a frontend engineering improvement that product or design did not initially prioritize.",
    expectedKeywords: ["influence", "trade-off", "user impact", "communication", "result"],
    followUpHints: ["how you framed the issue", "how you measured impact"],
    evaluationFocus: ["communication", "role fit"],
    rubric: "Expect stakeholder management, prioritization, and an outcome tied to users or team efficiency."
  }
];

const SEED_KNOWLEDGE: SeedKnowledgeSnippet[] = [
  {
    positionSlug: "java-backend-engineer",
    title: "Cache and database consistency patterns",
    summary: "Common options for keeping Redis and MySQL data aligned under write pressure.",
    content: "Cover cache invalidation timing, delayed double delete, idempotent retry, hot key protection, and what to monitor after deployment.",
    tags: ["cache invalidation", "Redis", "MySQL", "retry", "hot key"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "java-backend-engineer",
    title: "Traffic spike stabilization playbook",
    summary: "A practical incident flow for overload and downstream timeout scenarios.",
    content: "Prioritize observability, rate limiting, graceful degradation, queue buffering, timeout budgets, circuit breaking, and rollback triggers.",
    tags: ["rate limit", "queue", "timeout", "monitoring", "degrade"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "java-backend-engineer",
    title: "Backend project storytelling",
    summary: "How to explain ownership, bottlenecks, and measurable impact in project interviews.",
    content: "Structure the answer around context, architecture, bottleneck, measurement, trade-off, implementation, and result.",
    tags: ["architecture", "bottleneck", "metrics", "trade-off"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "web-frontend-engineer",
    title: "Browser rendering bottlenecks",
    summary: "A compact refresher on the rendering pipeline and typical causes of slow pages.",
    content: "Trace DOM, CSSOM, render tree, layout, paint, compositing, main-thread blocking, and how forced reflow appears in profiling tools.",
    tags: ["DOM", "CSSOM", "render tree", "layout", "paint"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "web-frontend-engineer",
    title: "Performance regression debugging flow",
    summary: "A disciplined path from symptom to rollback or fix for frontend slowdowns.",
    content: "Measure baseline, inspect bundle changes, compare network waterfall, profile rendering, isolate regressions, and guard against repeat incidents.",
    tags: ["profiling", "bundle", "waterfall", "regression", "render"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "web-frontend-engineer",
    title: "Frontend project interview framing",
    summary: "How to present architecture and collaboration choices in a frontend project answer.",
    content: "Describe architecture, state strategy, collaboration with product and design, release constraints, quality gates, and the trade-off behind the final choice.",
    tags: ["architecture", "state management", "collaboration", "trade-off"],
    difficulty: "intermediate"
  }
];

@Injectable()
export class MvpSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(KnowledgeSnippet)
    private readonly knowledgeRepository: Repository<KnowledgeSnippet>
  ) {}

  async onApplicationBootstrap() {
    const positionMap = await this.seedPositions();
    await this.seedQuestions(positionMap);
    await this.seedKnowledge(positionMap);
  }

  private async seedPositions() {
    const positionMap = new Map<string, Position>();

    for (const seedPosition of SEED_POSITIONS) {
      let position = await this.positionsRepository.findOneBy({ slug: seedPosition.slug });

      if (!position) {
        position = this.positionsRepository.create(seedPosition);
      } else {
        Object.assign(position, seedPosition);
      }

      const savedPosition = await this.positionsRepository.save(position);
      positionMap.set(seedPosition.slug, savedPosition);
    }

    return positionMap;
  }

  private async seedQuestions(positionMap: Map<string, Position>) {
    for (const seedQuestion of SEED_QUESTIONS) {
      const position = positionMap.get(seedQuestion.positionSlug);
      if (!position) {
        continue;
      }

      let question = await this.questionsRepository.findOneBy({
        positionId: position.id,
        topic: seedQuestion.topic
      });

      if (!question) {
        question = this.questionsRepository.create({
          ...seedQuestion,
          positionId: position.id,
          isActive: true
        });
      } else {
        Object.assign(question, {
          ...seedQuestion,
          positionId: position.id,
          isActive: true
        });
      }

      await this.questionsRepository.save(question);
    }
  }

  private async seedKnowledge(positionMap: Map<string, Position>) {
    for (const seedSnippet of SEED_KNOWLEDGE) {
      const position = positionMap.get(seedSnippet.positionSlug);
      if (!position) {
        continue;
      }

      let snippet = await this.knowledgeRepository.findOneBy({
        positionId: position.id,
        title: seedSnippet.title
      });

      if (!snippet) {
        snippet = this.knowledgeRepository.create({
          ...seedSnippet,
          positionId: position.id
        });
      } else {
        Object.assign(snippet, {
          ...seedSnippet,
          positionId: position.id
        });
      }

      await this.knowledgeRepository.save(snippet);
    }
  }
}

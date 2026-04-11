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
    name: "Java 后端工程师",
    description: "面向后端岗位的模拟面试，覆盖 Java、分布式系统、数据存储以及生产环境中的技术权衡。",
    highlights: ["Spring Boot", "MySQL", "Redis", "消息队列", "系统设计"],
    evaluationDimensions: ["技术准确性", "知识深度", "表达沟通", "岗位匹配度"],
    defaultDifficulty: "intermediate",
    defaultQuestionCount: 4
  },
  {
    slug: "web-frontend-engineer",
    name: "Web 前端工程师",
    description: "面向前端岗位的模拟面试，覆盖浏览器原理、框架工程化、性能优化与线上排障。",
    highlights: ["浏览器渲染", "Vue 或 React", "性能优化", "工程质量"],
    evaluationDimensions: ["技术准确性", "知识深度", "表达沟通", "岗位匹配度"],
    defaultDifficulty: "intermediate",
    defaultQuestionCount: 4
  }
];

const SEED_QUESTIONS: SeedQuestion[] = [
  {
    positionSlug: "java-backend-engineer",
    topic: "缓存一致性",
    type: "technical",
    difficulty: "intermediate",
    content: "在高并发系统中，你会如何处理 Redis 与 MySQL 之间的缓存一致性问题？",
    expectedKeywords: ["缓存失效", "延迟双删", "重试", "数据库一致性", "热点 Key"],
    followUpHints: ["故障处理", "重试时机", "热点 Key 保护"],
    evaluationFocus: ["Redis", "MySQL", "系统设计"],
    rubric: "需要给出具体的一致性方案，说明失败路径，并讨论在高流量下的缓解手段。"
  },
  {
    positionSlug: "java-backend-engineer",
    topic: "项目深挖",
    type: "project",
    difficulty: "intermediate",
    content: "选择一个你做过的后端项目，说明整体架构、遇到的瓶颈，以及你是如何定位并解决这些问题的。",
    expectedKeywords: ["架构", "瓶颈", "指标", "权衡", "优化"],
    followUpHints: ["如何衡量效果", "为什么这个方案合适"],
    evaluationFocus: ["系统设计", "表达沟通"],
    rubric: "重点考察候选人的负责范围、推理过程、指标意识，以及是否能把技术选择和结果关联起来。"
  },
  {
    positionSlug: "java-backend-engineer",
    topic: "订单突增场景",
    type: "scenario",
    difficulty: "intermediate",
    content: "订单服务突然流量暴涨，下游依赖开始超时。你会先做什么？又会如何一步步把系统稳定下来？",
    expectedKeywords: ["限流", "降级", "队列", "超时", "监控"],
    followUpHints: ["稳定顺序", "可观测性", "回滚策略"],
    evaluationFocus: ["消息队列", "系统设计"],
    rubric: "重点看是否具备明确的优先级、隔离思路、可观测性意识，以及分阶段恢复方案。"
  },
  {
    positionSlug: "java-backend-engineer",
    topic: "跨团队沟通",
    type: "behavioral",
    difficulty: "intermediate",
    content: "讲一个你因为可靠性或可扩展性风险，而对后端需求提出异议并推动调整的经历。",
    expectedKeywords: ["风险", "权衡", "干系人", "沟通", "结果"],
    followUpHints: ["你如何影响决策", "你使用了哪些数据"],
    evaluationFocus: ["表达沟通", "岗位匹配度"],
    rubric: "重点看背景是否清晰、决策标准是否明确，以及是否能体现与干系人的沟通能力。"
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "渲染流水线",
    type: "technical",
    difficulty: "intermediate",
    content: "请你说明浏览器如何把 HTML、CSS 和 JavaScript 转换成最终屏幕上的像素，以及性能问题通常出现在什么阶段。",
    expectedKeywords: ["DOM", "CSSOM", "渲染树", "布局", "绘制"],
    followUpHints: ["重排原因", "JavaScript 的影响", "性能分析"],
    evaluationFocus: ["浏览器渲染", "性能优化"],
    rubric: "重点考察是否能清晰解释渲染流水线，以及是否了解常见性能瓶颈。"
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "前端项目深挖",
    type: "project",
    difficulty: "intermediate",
    content: "选择一个你做过的前端项目，介绍架构设计、协作方式，以及你做过的最大一次工程权衡。",
    expectedKeywords: ["架构", "状态管理", "权衡", "协作", "交付"],
    followUpHints: ["架构如何演进", "质量控制手段"],
    evaluationFocus: ["工程质量", "表达沟通"],
    rubric: "重点看是否具备系统性思考、项目主人翁意识，以及如何平衡质量与交付速度。"
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "页面性能变慢",
    type: "scenario",
    difficulty: "intermediate",
    content: "一个核心页面在新版本发布后明显变慢了。你会如何排查，并最终修复这个问题？",
    expectedKeywords: ["性能分析", "构建产物", "瀑布流", "渲染", "回归"],
    followUpHints: ["测量方案", "回滚标准", "如何防止再次发生"],
    evaluationFocus: ["性能优化", "工程质量"],
    rubric: "重点看是否有假设驱动的排查流程，以及对回滚和修复之间权衡的理解。"
  },
  {
    positionSlug: "web-frontend-engineer",
    topic: "推动产品范围调整",
    type: "behavioral",
    difficulty: "intermediate",
    content: "描述一次你推动前端工程改进，但产品或设计最初并不优先支持的经历。",
    expectedKeywords: ["影响力", "权衡", "用户影响", "沟通", "结果"],
    followUpHints: ["你如何定义问题", "你如何衡量影响"],
    evaluationFocus: ["表达沟通", "岗位匹配度"],
    rubric: "重点看干系人管理、优先级判断，以及最终结果是否和用户价值或团队效率相关。"
  }
];

const SEED_KNOWLEDGE: SeedKnowledgeSnippet[] = [
  {
    positionSlug: "java-backend-engineer",
    title: "缓存与数据库一致性模式",
    summary: "总结在高写入压力下保持 Redis 与 MySQL 数据一致的常见方案。",
    content: "覆盖缓存失效时机、延迟双删、幂等重试、热点 Key 保护，以及上线后需要重点关注的监控项。",
    tags: ["缓存失效", "Redis", "MySQL", "重试", "热点 Key"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "java-backend-engineer",
    title: "流量突增稳定性处置手册",
    summary: "面向过载与下游超时场景的实战处理流程。",
    content: "优先关注可观测性、限流、优雅降级、队列缓冲、超时预算、熔断策略以及回滚触发条件。",
    tags: ["限流", "队列", "超时", "监控", "降级"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "java-backend-engineer",
    title: "后端项目讲述方法",
    summary: "帮助候选人在项目面试中讲清负责范围、瓶颈与可量化结果。",
    content: "建议按项目背景、系统架构、性能瓶颈、衡量指标、技术权衡、实施过程和最终结果来组织表达。",
    tags: ["架构", "瓶颈", "指标", "权衡"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "web-frontend-engineer",
    title: "浏览器渲染瓶颈",
    summary: "快速回顾渲染流水线，以及页面变慢时最常见的原因。",
    content: "梳理 DOM、CSSOM、渲染树、布局、绘制、合成、主线程阻塞，以及强制重排在性能分析工具中的表现。",
    tags: ["DOM", "CSSOM", "渲染树", "布局", "绘制"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "web-frontend-engineer",
    title: "性能回归排查流程",
    summary: "提供一条从问题出现到回滚或修复的前端性能排查路径。",
    content: "先建立基线，再检查构建产物变化、对比网络瀑布流、分析渲染过程、隔离回归点，并补上防止复发的措施。",
    tags: ["性能分析", "构建产物", "瀑布流", "回归", "渲染"],
    difficulty: "intermediate"
  },
  {
    positionSlug: "web-frontend-engineer",
    title: "前端项目面试表达框架",
    summary: "帮助候选人更有条理地讲清前端项目中的架构与协作决策。",
    content: "可以围绕系统架构、状态策略、与产品和设计的协作方式、发布时间约束、质量门禁以及最终方案背后的权衡来展开。",
    tags: ["架构", "状态管理", "协作", "权衡"],
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
    const enabled = (process.env.MVP_SEED ?? "false").toLowerCase() === "true";
    if (!enabled) {
      return;
    }

    // Do not block application startup on seed execution.
    void this.seedAll();
  }

  private async seedAll() {
    try {
      const positionMap = await this.seedPositions();
      await this.seedQuestions(positionMap);
      await this.seedKnowledge(positionMap);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`MVP seed failed: ${message}`);
    }
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

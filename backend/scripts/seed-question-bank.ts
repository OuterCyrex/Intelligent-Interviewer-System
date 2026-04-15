type QuestionType = "technical" | "project" | "scenario" | "behavioral";
type QuestionDifficulty = "junior" | "intermediate" | "senior";

interface Position {
  id: string;
  slug: string;
  name: string;
}

interface QuestionRecord {
  id: string;
  positionId: string;
  content: string;
}

interface CreateQuestionPayload {
  positionId: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  content: string;
  topic: string;
  expectedKeywords: string[];
  followUpHints: string[];
  evaluationFocus: string[];
  rubric: string;
  isActive: boolean;
}

interface TopicTemplate {
  topic: string;
  keywords: string[];
  followUpHints: string[];
  evaluationFocus?: string[];
}

interface RoleTemplate {
  slug: string;
  displayName: string;
  defaultFocus: string[];
  topics: TopicTemplate[];
}

interface CliOptions {
  apiBaseUrl: string;
  dryRun: boolean;
  perRoleMin: number;
  onlySlugs?: Set<string>;
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_PER_ROLE_MIN = 40;

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    slug: "java-backend-engineer",
    displayName: "Java后端工程师",
    defaultFocus: ["系统设计", "并发控制", "稳定性治理"],
    topics: [
      {
        topic: "缓存与数据库一致性",
        keywords: ["Redis", "MySQL", "延迟双删", "重试补偿", "热点Key"],
        followUpHints: ["一致性策略", "失败场景", "监控与回滚"],
        evaluationFocus: ["缓存设计", "数据库设计"]
      },
      {
        topic: "MySQL索引与慢查询优化",
        keywords: ["索引设计", "执行计划", "回表", "覆盖索引", "慢查询日志"],
        followUpHints: ["定位步骤", "优化收益", "上线风险"],
        evaluationFocus: ["数据库设计", "性能优化"]
      },
      {
        topic: "事务隔离与并发异常",
        keywords: ["事务隔离级别", "脏读", "不可重复读", "幻读", "锁"],
        followUpHints: ["业务一致性", "锁冲突", "权衡策略"],
        evaluationFocus: ["数据库设计", "并发控制"]
      },
      {
        topic: "消息队列可靠性与顺序性",
        keywords: ["消息丢失", "重复消费", "幂等", "顺序消息", "死信队列"],
        followUpHints: ["可靠投递", "消费重试", "故障恢复"],
        evaluationFocus: ["消息队列", "稳定性治理"]
      },
      {
        topic: "分布式锁与幂等设计",
        keywords: ["分布式锁", "锁续期", "幂等键", "重入", "补偿机制"],
        followUpHints: ["锁失效处理", "幂等落库", "并发压测"],
        evaluationFocus: ["并发控制", "系统设计"]
      },
      {
        topic: "线程池与异步任务治理",
        keywords: ["线程池参数", "拒绝策略", "上下文传播", "异步编排", "资源隔离"],
        followUpHints: ["容量评估", "故障隔离", "监控指标"],
        evaluationFocus: ["并发控制", "性能优化"]
      },
      {
        topic: "微服务拆分与服务治理",
        keywords: ["服务边界", "接口幂等", "服务发现", "配置中心", "灰度发布"],
        followUpHints: ["拆分原则", "版本兼容", "回滚策略"],
        evaluationFocus: ["系统设计", "工程质量"]
      },
      {
        topic: "高并发限流降级熔断",
        keywords: ["限流", "降级", "熔断", "超时预算", "舱壁隔离"],
        followUpHints: ["止损顺序", "策略参数", "恢复条件"],
        evaluationFocus: ["稳定性治理", "系统设计"]
      },
      {
        topic: "可观测性与线上故障排查",
        keywords: ["日志", "指标", "链路追踪", "告警", "根因定位"],
        followUpHints: ["排查路径", "数据证据", "复盘改进"],
        evaluationFocus: ["工程质量", "稳定性治理"]
      },
      {
        topic: "接口设计与安全防护",
        keywords: ["鉴权", "幂等", "参数校验", "限流", "数据脱敏"],
        followUpHints: ["安全基线", "风控策略", "合规要求"],
        evaluationFocus: ["系统设计", "工程质量"]
      }
    ]
  },
  {
    slug: "web-frontend-engineer",
    displayName: "Web前端工程师",
    defaultFocus: ["性能优化", "工程质量", "浏览器渲染"],
    topics: [
      {
        topic: "浏览器渲染流水线",
        keywords: ["DOM", "CSSOM", "渲染树", "重排", "重绘"],
        followUpHints: ["关键阶段", "性能瓶颈", "优化抓手"],
        evaluationFocus: ["浏览器渲染", "性能优化"]
      },
      {
        topic: "事件循环与异步调度",
        keywords: ["宏任务", "微任务", "Promise", "setTimeout", "任务队列"],
        followUpHints: ["执行顺序", "异常处理", "性能影响"],
        evaluationFocus: ["JavaScript基础", "性能优化"]
      },
      {
        topic: "长列表与海量数据渲染",
        keywords: ["虚拟列表", "分片渲染", "懒加载", "骨架屏", "滚动性能"],
        followUpHints: ["首屏策略", "滚动优化", "交互体验"],
        evaluationFocus: ["性能优化", "工程质量"]
      },
      {
        topic: "状态管理与组件设计",
        keywords: ["状态提升", "单向数据流", "可复用组件", "副作用管理", "解耦"],
        followUpHints: ["边界划分", "可维护性", "测试策略"],
        evaluationFocus: ["Vue 或 React", "工程质量"]
      },
      {
        topic: "构建工具与工程化体系",
        keywords: ["Vite", "Webpack", "Tree Shaking", "代码分割", "缓存策略"],
        followUpHints: ["构建提速", "产物治理", "发布流程"],
        evaluationFocus: ["工程质量", "性能优化"]
      },
      {
        topic: "前端性能监控与优化闭环",
        keywords: ["LCP", "CLS", "TTFB", "埋点", "性能预算"],
        followUpHints: ["指标体系", "问题定位", "优化验证"],
        evaluationFocus: ["性能优化", "工程质量"]
      },
      {
        topic: "前端安全与数据防护",
        keywords: ["XSS", "CSRF", "CSP", "输入校验", "Token"],
        followUpHints: ["攻击面识别", "防护策略", "安全测试"],
        evaluationFocus: ["安全", "工程质量"]
      },
      {
        topic: "跨端兼容与降级策略",
        keywords: ["兼容性", "Polyfill", "特性检测", "降级", "渐进增强"],
        followUpHints: ["版本策略", "风险评估", "回滚方案"],
        evaluationFocus: ["工程质量", "用户体验"]
      },
      {
        topic: "线上异常监控与排障",
        keywords: ["错误上报", "SourceMap", "版本比对", "告警", "影响面"],
        followUpHints: ["定位流程", "止损动作", "复盘机制"],
        evaluationFocus: ["工程质量", "性能优化"]
      },
      {
        topic: "团队协作与代码质量治理",
        keywords: ["Code Review", "Lint", "测试覆盖", "规范", "技术债"],
        followUpHints: ["推动落地", "指标量化", "持续改进"],
        evaluationFocus: ["表达沟通", "工程质量"]
      }
    ]
  },
  {
    slug: "python-algorithm-engineer",
    displayName: "Python算法工程师",
    defaultFocus: ["算法能力", "模型评估", "工程部署"],
    topics: [
      {
        topic: "Python语言特性与性能优化",
        keywords: ["生成器", "迭代器", "GIL", "内存管理", "性能分析"],
        followUpHints: ["优化方法", "工具链", "代码可读性"],
        evaluationFocus: ["Python", "工程部署"]
      },
      {
        topic: "数据结构与复杂度分析",
        keywords: ["哈希表", "堆", "栈", "队列", "时间复杂度"],
        followUpHints: ["结构选择", "复杂度推导", "边界条件"],
        evaluationFocus: ["算法能力", "数据结构与算法"]
      },
      {
        topic: "排序与搜索算法实践",
        keywords: ["快排", "归并", "二分", "TopK", "稳定性"],
        followUpHints: ["适用场景", "复杂度权衡", "工程实现"],
        evaluationFocus: ["算法能力", "性能优化"]
      },
      {
        topic: "动态规划与图算法建模",
        keywords: ["状态定义", "状态转移", "最短路", "拓扑排序", "剪枝"],
        followUpHints: ["建模思路", "优化技巧", "正确性证明"],
        evaluationFocus: ["算法能力", "表达沟通"]
      },
      {
        topic: "特征工程与数据清洗",
        keywords: ["缺失值", "异常值", "特征编码", "标准化", "数据泄漏"],
        followUpHints: ["清洗流程", "特征选择", "风险控制"],
        evaluationFocus: ["机器学习", "工程部署"]
      },
      {
        topic: "模型评估与指标体系",
        keywords: ["Precision", "Recall", "F1", "AUC", "混淆矩阵"],
        followUpHints: ["指标选择", "业务对齐", "阈值策略"],
        evaluationFocus: ["模型评估", "表达沟通"]
      },
      {
        topic: "过拟合与泛化能力提升",
        keywords: ["正则化", "交叉验证", "早停", "数据增强", "偏差方差"],
        followUpHints: ["诊断方法", "改进策略", "实验设计"],
        evaluationFocus: ["机器学习", "模型评估"]
      },
      {
        topic: "模型部署与服务化",
        keywords: ["模型版本", "在线推理", "容器化", "延迟", "吞吐"],
        followUpHints: ["上线流程", "容量规划", "回滚方案"],
        evaluationFocus: ["工程部署", "稳定性治理"]
      },
      {
        topic: "训练稳定性与超参调优",
        keywords: ["学习率", "批大小", "梯度爆炸", "收敛", "实验追踪"],
        followUpHints: ["调参顺序", "实验记录", "结果解释"],
        evaluationFocus: ["机器学习", "模型评估"]
      },
      {
        topic: "数据漂移与线上监控",
        keywords: ["数据漂移", "概念漂移", "监控告警", "重训练", "A/B测试"],
        followUpHints: ["监控指标", "触发机制", "治理闭环"],
        evaluationFocus: ["工程部署", "模型评估"]
      }
    ]
  }
];

async function main() {
  const options = parseCli(process.argv.slice(2));
  const templates = options.onlySlugs
    ? ROLE_TEMPLATES.filter((item) => options.onlySlugs?.has(item.slug))
    : ROLE_TEMPLATES;

  if (templates.length === 0) {
    throw new Error("No matching role template found. Check --only argument.");
  }

  const positions = await apiRequest<Position[]>(options.apiBaseUrl, "/positions", "GET");
  const questionsBefore = await apiRequest<QuestionRecord[]>(options.apiBaseUrl, "/questions", "GET");

  let totalCreated = 0;
  console.log(`[seed-questions] total existing questions: ${questionsBefore.length}`);
  console.log(`[seed-questions] per-role minimum target: ${options.perRoleMin}`);
  console.log(`[seed-questions] dry-run: ${options.dryRun}`);

  for (const template of templates) {
    const position = positions.find((item) => item.slug === template.slug);
    if (!position) {
      console.warn(`[seed-questions] skipped ${template.slug}: position not found`);
      continue;
    }

    const existing = await apiRequest<QuestionRecord[]>(
      options.apiBaseUrl,
      `/positions/${position.id}/questions`,
      "GET"
    );
    const normalizedExisting = new Set(existing.map((item) => normalizeContent(item.content)));
    const needed = Math.max(0, options.perRoleMin - existing.length);

    if (needed === 0) {
      console.log(
        `[seed-questions] ${template.slug} already has ${existing.length} questions (>= ${options.perRoleMin})`
      );
      continue;
    }

    const candidates = buildCandidates(position.id, template).filter(
      (item) => !normalizedExisting.has(normalizeContent(item.content))
    );
    const toCreate = candidates.slice(0, needed);

    if (toCreate.length < needed) {
      console.warn(
        `[seed-questions] ${template.slug} needs ${needed} but only ${toCreate.length} unique candidates were generated`
      );
    }

    if (options.dryRun) {
      console.log(
        `[seed-questions] dry-run ${template.slug}: existing=${existing.length}, willCreate=${toCreate.length}`
      );
      totalCreated += toCreate.length;
      continue;
    }

    let createdForRole = 0;
    for (const payload of toCreate) {
      await apiRequest(options.apiBaseUrl, "/questions", "POST", payload);
      createdForRole += 1;
    }

    totalCreated += createdForRole;
    const after = existing.length + createdForRole;
    console.log(
      `[seed-questions] ${template.slug}: created=${createdForRole}, totalNow=${after}`
    );
  }

  if (!options.dryRun) {
    const questionsAfter = await apiRequest<QuestionRecord[]>(options.apiBaseUrl, "/questions", "GET");
    console.log(`[seed-questions] total created in this run: ${totalCreated}`);
    console.log(`[seed-questions] total questions now: ${questionsAfter.length}`);
  } else {
    console.log(`[seed-questions] dry-run planned create count: ${totalCreated}`);
  }
}

function buildCandidates(positionId: string, role: RoleTemplate) {
  const candidates: CreateQuestionPayload[] = [];
  const difficultyCycle: QuestionDifficulty[] = ["junior", "intermediate", "senior"];

  role.topics.forEach((item, index) => {
    const technicalDifficulty = difficultyCycle[index % difficultyCycle.length];
    const projectDifficulty: QuestionDifficulty = index % 2 === 0 ? "intermediate" : "senior";
    const scenarioDifficulty: QuestionDifficulty = index % 3 === 0 ? "senior" : "intermediate";
    const behavioralDifficulty: QuestionDifficulty = "intermediate";

    candidates.push(
      buildQuestion({
        positionId,
        role,
        topic: item,
        type: "technical",
        difficulty: technicalDifficulty,
        topicSuffix: "技术",
        content: `请系统说明「${item.topic}」的核心原理，并结合你的经验说明如何在真实项目中落地。`
      }),
      buildQuestion({
        positionId,
        role,
        topic: item,
        type: "project",
        difficulty: projectDifficulty,
        topicSuffix: "项目",
        content: `结合一个你做过的项目，讲一次你在「${item.topic}」上的设计或优化实践，包括背景、方案、权衡与结果。`
      }),
      buildQuestion({
        positionId,
        role,
        topic: item,
        type: "scenario",
        difficulty: scenarioDifficulty,
        topicSuffix: "场景",
        content: `如果线上出现与「${item.topic}」相关的故障或性能瓶颈，你会如何分阶段定位、止损并恢复系统？`
      }),
      buildQuestion({
        positionId,
        role,
        topic: item,
        type: "behavioral",
        difficulty: behavioralDifficulty,
        topicSuffix: "协作",
        content: `当团队在「${item.topic}」方案上存在明显分歧时，你会如何推动共识、控制风险并保障交付？`
      })
    );
  });

  return candidates;
}

function buildQuestion(params: {
  positionId: string;
  role: RoleTemplate;
  topic: TopicTemplate;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  topicSuffix: string;
  content: string;
}): CreateQuestionPayload {
  const expectedKeywords = unique(params.topic.keywords).slice(0, 6);
  const followUpHints = unique([
    ...params.topic.followUpHints,
    ...followHintsByType(params.type)
  ]).slice(0, 4);
  const evaluationFocus = unique([
    ...(params.topic.evaluationFocus ?? []),
    ...params.role.defaultFocus
  ]).slice(0, 4);

  return {
    positionId: params.positionId,
    type: params.type,
    difficulty: params.difficulty,
    content: params.content,
    topic: `${params.topic.topic}（${params.topicSuffix}）`,
    expectedKeywords,
    followUpHints,
    evaluationFocus,
    rubric: buildRubric(params.type, expectedKeywords),
    isActive: true
  };
}

function followHintsByType(type: QuestionType) {
  switch (type) {
    case "technical":
      return ["边界条件", "性能权衡", "可扩展性"];
    case "project":
      return ["负责范围", "关键决策", "量化结果"];
    case "scenario":
      return ["优先级判断", "止损策略", "复盘改进"];
    case "behavioral":
      return ["沟通方式", "冲突处理", "协作结果"];
    default:
      return [];
  }
}

function buildRubric(type: QuestionType, keywords: string[]) {
  const keywordText = keywords.slice(0, 4).join("、");
  switch (type) {
    case "technical":
      return `重点看技术原理是否准确，是否覆盖关键词（${keywordText}），以及是否能说明工程边界。`;
    case "project":
      return `重点看项目叙事是否完整，是否体现方案权衡、执行细节和量化结果，并能关联关键词（${keywordText}）。`;
    case "scenario":
      return `重点看排障与恢复路径是否清晰，是否具备优先级和止损意识，并能结合关键词（${keywordText}）给出可执行动作。`;
    case "behavioral":
      return `重点看沟通与协作能力，是否能在分歧场景中推进决策并保障交付，同时体现关键词（${keywordText}）相关理解。`;
    default:
      return "重点看回答的结构化程度与可执行性。";
  }
}

function normalizeContent(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function parseCli(args: string[]): CliOptions {
  let apiBaseUrl = DEFAULT_API_BASE_URL;
  let dryRun = false;
  let perRoleMin = DEFAULT_PER_ROLE_MIN;
  let onlySlugs: Set<string> | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--api":
        apiBaseUrl = (args[index + 1] || DEFAULT_API_BASE_URL).trim();
        index += 1;
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "--per-role":
        perRoleMin = Number(args[index + 1] || DEFAULT_PER_ROLE_MIN);
        index += 1;
        break;
      case "--only":
        onlySlugs = new Set(
          (args[index + 1] || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        );
        index += 1;
        break;
      default:
        break;
    }
  }

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
    dryRun,
    perRoleMin: Number.isFinite(perRoleMin) ? Math.max(1, Math.trunc(perRoleMin)) : DEFAULT_PER_ROLE_MIN,
    onlySlugs
  };
}

async function apiRequest<T = unknown>(
  apiBaseUrl: string,
  endpoint: string,
  method: "GET" | "POST",
  body?: unknown
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000)
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = String((payload as Record<string, unknown>).message ?? response.statusText);
    throw new Error(`API ${method} ${endpoint} failed (${response.status}): ${message}`);
  }
  return payload as T;
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[seed-questions] failed: ${message}`);
  process.exit(1);
});


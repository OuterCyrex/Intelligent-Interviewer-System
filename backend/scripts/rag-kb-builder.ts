import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

type Difficulty = "junior" | "intermediate" | "senior";

interface ImportOptions {
  maxChunkLength?: number;
  overlap?: number;
}

interface CrawlSource {
  name: string;
  entryUrls: string[];
  allowDomains?: string[];
  maxDepth?: number;
  maxPages?: number;
  includePathPatterns?: string[];
  excludePathPatterns?: string[];
}

interface RoleConfig {
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  difficulty?: Difficulty;
  coreTechStack: string[];
  commonTopics: string[];
  seedQuestions: string[];
  answerPrinciples: string[];
  sources: CrawlSource[];
}

interface BuilderConfig {
  apiBaseUrl: string;
  outputDir: string;
  requestTimeoutMs?: number;
  userAgent?: string;
  crawlDelayMs?: number;
  respectRobotsTxt?: boolean;
  maxPagesPerSource?: number;
  ingest?: boolean;
  rebuildEmbeddings?: boolean;
  import?: ImportOptions;
  roles: RoleConfig[];
}

interface CliOptions {
  configPath: string;
  apiBaseUrl?: string;
  dryRun: boolean;
  ingestOverride?: boolean;
  onlySlugs?: Set<string>;
  maxPagesOverride?: number;
}

interface CrawlTask {
  url: string;
  depth: number;
}

interface CrawlResult {
  pages: CrawledPage[];
  failedUrls: Array<{ url: string; reason: string }>;
}

interface CrawledPage {
  url: string;
  sourceName: string;
  title: string;
  headings: string[];
  text: string;
  questions: string[];
}

interface Position {
  id: string;
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  evaluationDimensions: string[];
  defaultDifficulty: Difficulty;
  defaultQuestionCount: number;
}

interface KnowledgeDoc {
  title: string;
  tags: string[];
  markdown: string;
}

interface RobotsRule {
  disallow: string[];
  allow: string[];
}

const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), "scripts", "rag-kb.config.example.json");
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_CRAWL_DELAY_MS = 200;
const DEFAULT_MAX_PAGES = 20;
const DEFAULT_USER_AGENT =
  "InterveneRagBot/1.0 (+https://localhost/intervene-app; purpose=interview-kb-crawler)";

async function main() {
  const cli = parseCliArgs(process.argv.slice(2));
  const config = await loadConfig(cli.configPath);
  const apiBaseUrl = (cli.apiBaseUrl ?? config.apiBaseUrl ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const outputDir = path.resolve(process.cwd(), config.outputDir || "tmp/rag-kb");
  const timeoutMs = Number(config.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS);
  const crawlDelayMs = Number(config.crawlDelayMs ?? DEFAULT_CRAWL_DELAY_MS);
  const respectRobotsTxt = config.respectRobotsTxt !== false;
  const globalMaxPages = Number(cli.maxPagesOverride ?? config.maxPagesPerSource ?? DEFAULT_MAX_PAGES);
  const ingestEnabled =
    cli.ingestOverride !== undefined ? cli.ingestOverride : config.ingest !== false;
  const importOptions: Required<ImportOptions> = {
    maxChunkLength: Math.max(300, Math.min(4_000, Math.trunc(config.import?.maxChunkLength ?? 1_200))),
    overlap: Math.max(0, Math.min(400, Math.trunc(config.import?.overlap ?? 120)))
  };
  const userAgent = (config.userAgent || DEFAULT_USER_AGENT).trim() || DEFAULT_USER_AGENT;

  await mkdir(outputDir, { recursive: true });

  console.log(`\n[rag-kb] api: ${apiBaseUrl}`);
  console.log(`[rag-kb] output: ${outputDir}`);
  console.log(`[rag-kb] dry-run: ${cli.dryRun}`);
  console.log(`[rag-kb] ingest: ${ingestEnabled && !cli.dryRun}`);
  console.log(`[rag-kb] roles configured: ${config.roles.length}`);

  let positions: Position[] = [];
  if (!cli.dryRun) {
    positions = await apiRequest<Position[]>(apiBaseUrl, "/positions", {
      method: "GET",
      timeoutMs,
      userAgent
    });
  }

  const selectedRoles = config.roles.filter((role) =>
    cli.onlySlugs ? cli.onlySlugs.has(role.slug) : true
  );

  if (selectedRoles.length === 0) {
    throw new Error("No roles selected. Check --only argument or config roles.");
  }

  for (const role of selectedRoles) {
    console.log(`\n[rag-kb] ===== role: ${role.slug} (${role.name}) =====`);

    const roleOutputDir = path.join(outputDir, role.slug);
    await mkdir(roleOutputDir, { recursive: true });

    const crawlSummary: Array<{ source: string; pages: number; failed: number }> = [];
    const crawledPages: CrawledPage[] = [];
    const failedUrls: Array<{ url: string; reason: string }> = [];

    for (const source of role.sources) {
      const sourceResult = await crawlSource({
        source,
        timeoutMs,
        crawlDelayMs,
        maxPages: Math.max(1, Math.min(globalMaxPages, source.maxPages ?? globalMaxPages)),
        userAgent,
        respectRobotsTxt
      });

      crawledPages.push(...sourceResult.pages);
      failedUrls.push(...sourceResult.failedUrls);
      crawlSummary.push({
        source: source.name,
        pages: sourceResult.pages.length,
        failed: sourceResult.failedUrls.length
      });

      console.log(
        `[rag-kb] source "${source.name}" => pages=${sourceResult.pages.length}, failed=${sourceResult.failedUrls.length}`
      );
    }

    const uniquePages = dedupePages(crawledPages);
    const docs = buildKnowledgeDocs(role, uniquePages);
    const report = {
      role: { slug: role.slug, name: role.name },
      generatedAt: new Date().toISOString(),
      crawledPageCount: uniquePages.length,
      crawlSummary,
      failedUrls,
      generatedDocs: docs.map((doc) => ({
        title: doc.title,
        tags: doc.tags,
        length: doc.markdown.length
      })),
      sampledSources: uniquePages.slice(0, 50).map((page) => ({ title: page.title, url: page.url }))
    };

    await writeFile(path.join(roleOutputDir, "crawl-report.json"), JSON.stringify(report, null, 2), "utf8");
    for (const doc of docs) {
      const fileName = slugify(doc.title) || "knowledge-doc";
      await writeFile(path.join(roleOutputDir, `${fileName}.md`), doc.markdown, "utf8");
    }

    if (cli.dryRun) {
      console.log("[rag-kb] dry-run enabled: skip API ingestion.");
      continue;
    }

    const position = await ensurePosition(apiBaseUrl, positions, role, timeoutMs, userAgent);
    if (ingestEnabled) {
      for (const doc of docs) {
        const payload = {
          positionId: position.id,
          title: doc.title,
          markdown: doc.markdown,
          tags: doc.tags,
          difficulty: role.difficulty ?? "intermediate",
          maxChunkLength: importOptions.maxChunkLength,
          overlap: importOptions.overlap
        };
        const result = await apiRequest(apiBaseUrl, "/knowledge/import-markdown", {
          method: "POST",
          timeoutMs,
          userAgent,
          body: payload
        });
        const importedCount = Number((result as Record<string, unknown>).importedCount ?? 0);
        console.log(`[rag-kb] imported "${doc.title}" chunks=${importedCount}`);
      }

      if (config.rebuildEmbeddings) {
        await apiRequest(apiBaseUrl, "/knowledge/rebuild-embeddings", {
          method: "POST",
          timeoutMs,
          userAgent,
          body: {
            positionId: position.id,
            difficulty: role.difficulty ?? "intermediate",
            limit: 1_000
          }
        });
        console.log("[rag-kb] embeddings rebuilt for role.");
      }
    } else {
      console.log("[rag-kb] ingest disabled by config/cli.");
    }
  }

  console.log("\n[rag-kb] completed.");
}

function parseCliArgs(args: string[]): CliOptions {
  let configPath = DEFAULT_CONFIG_PATH;
  let apiBaseUrl: string | undefined;
  let dryRun = false;
  let ingestOverride: boolean | undefined;
  let onlySlugs: Set<string> | undefined;
  let maxPagesOverride: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--config":
        configPath = path.resolve(process.cwd(), args[index + 1] || "");
        index += 1;
        break;
      case "--api":
        apiBaseUrl = (args[index + 1] || "").trim();
        index += 1;
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "--ingest":
        ingestOverride = true;
        break;
      case "--no-ingest":
        ingestOverride = false;
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
      case "--max-pages":
        maxPagesOverride = Number(args[index + 1]);
        index += 1;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        break;
    }
  }

  return { configPath, apiBaseUrl, dryRun, ingestOverride, onlySlugs, maxPagesOverride };
}

function printHelp() {
  console.log(`
Usage:
  npm run rag:kb -- [options]

Options:
  --config <path>      Config JSON path (default: scripts/rag-kb.config.example.json)
  --api <url>          Backend api base url (overrides config.apiBaseUrl)
  --dry-run            Skip backend API write operations
  --ingest             Force ingest on
  --no-ingest          Force ingest off
  --only <slug,...>    Only run selected role slugs
  --max-pages <n>      Global max pages per source
  --help               Print help
  `);
}

async function loadConfig(configPath: string) {
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw) as BuilderConfig;
  if (!Array.isArray(config.roles) || config.roles.length === 0) {
    throw new Error(`No roles found in config: ${configPath}`);
  }
  return config;
}

async function apiRequest<T = unknown>(
  apiBaseUrl: string,
  endpoint: string,
  options: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    timeoutMs: number;
    userAgent: string;
    body?: unknown;
  }
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": options.userAgent
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(options.timeoutMs)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : String((payload as Record<string, unknown>).message ?? response.statusText);
    throw new Error(`API ${options.method} ${endpoint} failed (${response.status}): ${message}`);
  }

  return payload as T;
}

async function ensurePosition(
  apiBaseUrl: string,
  existingPositions: Position[],
  role: RoleConfig,
  timeoutMs: number,
  userAgent: string
) {
  let found = existingPositions.find((position) => position.slug === role.slug);
  if (found) {
    console.log(`[rag-kb] position found: ${found.slug} (${found.id})`);
    return found;
  }

  const created = await apiRequest<Position>(apiBaseUrl, "/positions", {
    method: "POST",
    timeoutMs,
    userAgent,
    body: {
      slug: role.slug,
      name: role.name,
      description: role.description,
      highlights: role.highlights,
      evaluationDimensions: ["技术准确性", "知识深度", "表达沟通", "岗位匹配度"],
      defaultDifficulty: role.difficulty ?? "intermediate",
      defaultQuestionCount: 4
    }
  });
  existingPositions.push(created);
  console.log(`[rag-kb] position created: ${created.slug} (${created.id})`);
  return created;
}

async function crawlSource(params: {
  source: CrawlSource;
  timeoutMs: number;
  crawlDelayMs: number;
  maxPages: number;
  userAgent: string;
  respectRobotsTxt: boolean;
}): Promise<CrawlResult> {
  const { source, timeoutMs, maxPages, crawlDelayMs, userAgent, respectRobotsTxt } = params;
  const maxDepth = Math.max(0, source.maxDepth ?? 1);
  const queue: CrawlTask[] = source.entryUrls.map((url) => ({ url: normalizeUrl(url), depth: 0 }));
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const failedUrls: Array<{ url: string; reason: string }> = [];
  const robotsCache = new Map<string, RobotsRule | null>();

  while (queue.length > 0 && pages.length < maxPages) {
    const task = queue.shift() as CrawlTask;
    if (!task.url || visited.has(task.url)) {
      continue;
    }
    visited.add(task.url);

    if (!canVisitUrl(task.url, source)) {
      continue;
    }

    if (respectRobotsTxt) {
      const allowed = await isAllowedByRobots(task.url, robotsCache, timeoutMs, userAgent);
      if (!allowed) {
        failedUrls.push({ url: task.url, reason: "blocked-by-robots" });
        continue;
      }
    }

    const pageFetch = await fetchHtml(task.url, timeoutMs, userAgent);
    if (!pageFetch.ok) {
      failedUrls.push({ url: task.url, reason: pageFetch.reason });
      continue;
    }

    const extracted = extractPage(task.url, source.name, pageFetch.html);
    if (!extracted) {
      failedUrls.push({ url: task.url, reason: "unusable-html" });
      continue;
    }

    pages.push(extracted.page);

    if (task.depth < maxDepth) {
      for (const nextUrl of extracted.links) {
        if (visited.has(nextUrl) || !canVisitUrl(nextUrl, source)) {
          continue;
        }
        queue.push({ url: nextUrl, depth: task.depth + 1 });
      }
    }

    if (crawlDelayMs > 0) {
      await sleep(crawlDelayMs);
    }
  }

  return { pages, failedUrls };
}

function canVisitUrl(url: string, source: CrawlSource) {
  const parsed = safeParseUrl(url);
  if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
    return false;
  }

  if (Array.isArray(source.allowDomains) && source.allowDomains.length > 0) {
    if (!source.allowDomains.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`))) {
      return false;
    }
  }

  const pathText = `${parsed.pathname}${parsed.search}`;
  if (source.includePathPatterns?.length) {
    const hasIncluded = source.includePathPatterns.some((pattern) => new RegExp(pattern, "i").test(pathText));
    if (!hasIncluded) {
      return false;
    }
  }

  if (source.excludePathPatterns?.length) {
    const excluded = source.excludePathPatterns.some((pattern) => new RegExp(pattern, "i").test(pathText));
    if (excluded) {
      return false;
    }
  }

  return true;
}

function safeParseUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

async function fetchHtml(url: string, timeoutMs: number, userAgent: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
      return { ok: false as const, reason: `http-${response.status}` };
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return { ok: false as const, reason: "non-html-content" };
    }
    const html = await response.text();
    if (!html || html.length < 300) {
      return { ok: false as const, reason: "html-too-short" };
    }
    return { ok: true as const, html };
  } catch (error) {
    return { ok: false as const, reason: `fetch-error:${error instanceof Error ? error.message : String(error)}` };
  }
}

function extractPage(url: string, sourceName: string, html: string) {
  const $ = load(html);
  $("script,style,noscript,svg,iframe,canvas,form,footer,nav,header").remove();

  const title = normalizeText(
    $('meta[property="og:title"]').attr("content") ||
      $("title").first().text() ||
      $("h1").first().text()
  );

  const root = $("article").first().length
    ? $("article").first()
    : $("main").first().length
      ? $("main").first()
      : $("body").first();

  const headings = unique(
    root
      .find("h1,h2,h3")
      .map((_, element) => normalizeText($(element).text()))
      .get()
      .filter((line) => line.length >= 6)
  ).slice(0, 40);

  const textBlocks = root
    .find("p,li,pre,code")
    .map((_, element) => normalizeText($(element).text()))
    .get()
    .filter((line) => line.length >= 12);
  const bodyText = unique(textBlocks).join("\n");
  if (!bodyText || bodyText.length < 600) {
    return null;
  }

  const links = unique(
    root
      .find("a[href]")
      .map((_, element) => $(element).attr("href")?.trim() ?? "")
      .get()
      .map((href) => toAbsoluteUrl(url, href))
      .filter((value): value is string => Boolean(value))
  );

  const questions = extractQuestions(`${headings.join("\n")}\n${bodyText}`);
  return {
    page: {
      url,
      sourceName,
      title: title || url,
      headings,
      text: bodyText,
      questions
    },
    links
  };
}

function toAbsoluteUrl(baseUrl: string, href: string) {
  if (!href || href.startsWith("#")) {
    return null;
  }
  try {
    const absolute = new URL(href, baseUrl);
    if (!["http:", "https:"].includes(absolute.protocol)) {
      return null;
    }
    absolute.hash = "";
    return normalizeUrl(absolute.toString());
  } catch {
    return null;
  }
}

function extractQuestions(text: string) {
  const lines = splitSentences(text);
  const questionLike = lines
    .map((line) => normalizeText(line))
    .filter((line) => line.length >= 8 && line.length <= 220)
    .filter((line) =>
      /(\?|？)$/.test(line) ||
      /^(q[:：]\s*|问[:：]\s*)/i.test(line) ||
      /(什么|如何|怎么|为何|为什么|谈谈|解释|区别|优化|设计|排查)/.test(line)
    );
  return unique(questionLike).slice(0, 120);
}

function buildKnowledgeDocs(role: RoleConfig, pages: CrawledPage[]): KnowledgeDoc[] {
  const generatedAt = new Date().toISOString();
  const allQuestions = unique([
    ...role.seedQuestions,
    ...pages.flatMap((page) => page.questions)
  ]);
  const allSentences = splitSentences(pages.map((page) => page.text).join("\n"));

  const stackInsights = role.coreTechStack.map((tech) => {
    const related = pickSentencesByKeyword(allSentences, tech, 2);
    return { tech, related };
  });

  const topicSections = role.commonTopics.map((topic) => ({
    topic,
    questions: pickQuestionsForTopic(allQuestions, topic, 5),
    related: pickSentencesByKeyword(allSentences, topic, 2)
  }));

  const sampleQuestions = allQuestions.slice(0, 8);
  const answerSamples = sampleQuestions.map((question) =>
    buildAnswerSample(question, role, allSentences)
  );

  const sourcesMarkdown =
    pages.length > 0
      ? unique(pages.map((page) => `- [${escapeMarkdown(page.title)}](${page.url})`)).slice(0, 60).join("\n")
      : "- 无可用网页内容（已使用配置中的种子问题与岗位模板生成基础知识）。";

  const stackDoc: KnowledgeDoc = {
    title: `${role.name} 核心技术栈图谱（自动采集）`,
    tags: [role.slug, "core-stack", "rag-source"],
    markdown: [
      `# ${role.name} 核心技术栈图谱`,
      "",
      `> 自动生成时间：${generatedAt}`,
      `> 自动采集页面数：${pages.length}`,
      "",
      "## 核心技术栈",
      ...stackInsights.flatMap((item) => {
        const bullets = item.related.length > 0
          ? item.related.map((line) => `- ${line}`)
          : [
              `- 面试中需要明确 ${item.tech} 的适用场景、核心原理、性能边界与线上治理手段。`
            ];
        return [`### ${item.tech}`, ...bullets, ""];
      }),
      "## 面试回答共性要求",
      ...role.answerPrinciples.map((item) => `- ${item}`),
      "",
      "## 采集来源",
      sourcesMarkdown
    ].join("\n")
  };

  const pointsDoc: KnowledgeDoc = {
    title: `${role.name} 常见面试考点题库（自动采集）`,
    tags: [role.slug, "interview-points", "rag-source"],
    markdown: [
      `# ${role.name} 常见面试考点题库`,
      "",
      `> 自动生成时间：${generatedAt}`,
      "",
      ...topicSections.flatMap((section, index) => {
        const questions = section.questions.length > 0
          ? section.questions
          : role.seedQuestions.slice(index, index + 4);
        const related = section.related.length > 0
          ? section.related
          : [`围绕 ${section.topic} 追问时，建议从原理、实现、权衡、监控四个层次作答。`];
        return [
          `## ${index + 1}. ${section.topic}`,
          "",
          "### 高频问题",
          ...questions.map((question, qIndex) => `${qIndex + 1}. ${question}`),
          "",
          "### 回答要点",
          ...related.map((line) => `- ${line}`),
          ""
        ];
      }),
      "## 来源",
      sourcesMarkdown
    ].join("\n")
  };

  const examplesDoc: KnowledgeDoc = {
    title: `${role.name} 优秀回答范例（自动采集）`,
    tags: [role.slug, "answer-examples", "rag-source"],
    markdown: [
      `# ${role.name} 优秀回答范例`,
      "",
      `> 自动生成时间：${generatedAt}`,
      "",
      ...answerSamples.flatMap((sample, index) => [
        `## 示例 ${index + 1}`,
        `### 问题`,
        sample.question,
        "",
        "### 示例回答框架",
        ...sample.steps.map((step) => `- ${step}`),
        ""
      ]),
      "## 来源",
      sourcesMarkdown
    ].join("\n")
  };

  return [stackDoc, pointsDoc, examplesDoc];
}

function buildAnswerSample(question: string, role: RoleConfig, sentences: string[]) {
  const keyword = role.coreTechStack.find((tech) => question.toLowerCase().includes(tech.toLowerCase()));
  const evidence = pickSentencesByKeyword(sentences, keyword ?? role.commonTopics[0] ?? role.slug, 1)[0];

  return {
    question,
    steps: [
      "先给结论：明确方案选择和适用场景，不先展开细节。",
      `再讲原理：说明核心机制、数据流和关键约束${keyword ? `（重点关联 ${keyword}）` : ""}。`,
      "补工程细节：给出上线实现、性能目标、监控指标和回滚策略。",
      "讲权衡：对比至少两个可选方案，解释成本、风险和边界条件。",
      evidence
        ? `结合案例：${evidence}`
        : "结合案例：给出真实项目中的一次故障排查或性能优化复盘。"
    ]
  };
}

function pickQuestionsForTopic(questions: string[], topic: string, limit: number) {
  const normalizedTopic = topic.toLowerCase();
  const candidates = questions.filter((question) => question.toLowerCase().includes(normalizedTopic));
  if (candidates.length >= limit) {
    return candidates.slice(0, limit);
  }

  const fallback = questions.filter((question) =>
    splitTopicKeywords(topic).some((keyword) => question.toLowerCase().includes(keyword.toLowerCase()))
  );
  return unique([...candidates, ...fallback]).slice(0, limit);
}

function splitTopicKeywords(topic: string) {
  return topic
    .split(/[、,/| ]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function pickSentencesByKeyword(sentences: string[], keyword: string, limit: number) {
  const normalizedKeyword = keyword.toLowerCase();
  const matches = sentences.filter((line) => line.toLowerCase().includes(normalizedKeyword));
  return unique(matches.map((line) => normalizeText(line))).slice(0, limit);
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[。！？?!])\s+|\n+/g)
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function normalizeText(input: string) {
  return input
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function dedupePages(pages: CrawledPage[]) {
  const map = new Map<string, CrawledPage>();
  for (const page of pages) {
    if (!map.has(page.url)) {
      map.set(page.url, page);
    }
  }
  return Array.from(map.values());
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

async function isAllowedByRobots(
  url: string,
  cache: Map<string, RobotsRule | null>,
  timeoutMs: number,
  userAgent: string
) {
  const target = safeParseUrl(url);
  if (!target) {
    return false;
  }

  const origin = target.origin;
  if (!cache.has(origin)) {
    const robotsUrl = `${origin}/robots.txt`;
    try {
      const response = await fetch(robotsUrl, {
        method: "GET",
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response.ok) {
        cache.set(origin, null);
      } else {
        const text = await response.text();
        cache.set(origin, parseRobots(text));
      }
    } catch {
      cache.set(origin, null);
    }
  }

  const rule = cache.get(origin) ?? null;
  if (!rule) {
    return true;
  }
  return evaluateRobots(target.pathname, rule);
}

function parseRobots(content: string): RobotsRule {
  const lines = content.split(/\r?\n/);
  const disallow: string[] = [];
  const allow: string[] = [];
  let inGlobalGroup = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const [keyPart, ...valueParts] = line.split(":");
    if (!keyPart || valueParts.length === 0) {
      continue;
    }

    const key = keyPart.trim().toLowerCase();
    const value = valueParts.join(":").trim();
    if (key === "user-agent") {
      inGlobalGroup = value === "*";
      continue;
    }

    if (!inGlobalGroup) {
      continue;
    }

    if (key === "disallow" && value) {
      disallow.push(value);
    } else if (key === "allow" && value) {
      allow.push(value);
    }
  }

  return { disallow, allow };
}

function evaluateRobots(pathname: string, rules: RobotsRule) {
  const matchedAllow = rules.allow
    .filter((pattern) => pathname.startsWith(pattern))
    .sort((a, b) => b.length - a.length)[0];
  const matchedDisallow = rules.disallow
    .filter((pattern) => pathname.startsWith(pattern))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedDisallow) {
    return true;
  }
  if (!matchedAllow) {
    return false;
  }
  return matchedAllow.length >= matchedDisallow.length;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeMarkdown(text: string) {
  return text.replace(/[[\]()*_`]/g, "\\$&");
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[rag-kb] failed: ${message}`);
  process.exit(1);
});


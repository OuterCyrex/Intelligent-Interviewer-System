import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

interface CliOptions {
  mode: "single" | "book";
  url: string;
  pathId: number;
  uuid: string;
  catalogId: number;
  cookie?: string;
  outDir: string;
  timeoutMs: number;
  delayMs: number;
}

interface CatalogSection {
  chapterId: number;
  chapterTitle: string;
  id: number;
  sectionId: number;
  sourceId: number;
  sourceType: number;
  status: number;
  title: string;
  uuid: string;
  wordCount: number;
}

interface CatalogData {
  title: string;
  tutorialId: number;
  catalogNum: number;
  catalog: CatalogSection[][];
}

interface TutorialSection {
  chapterId: number;
  chapterTitle: string;
  content: string;
  createTime: number;
  id: number;
  sectionId: number;
  sourceId: number;
  sourceType: number;
  status: number;
  title: string;
  tutorialId: number;
  uuid: string;
  watchCount: number;
  wordCount: number;
}

interface TutorialDetailData {
  entityType: number;
  entityId: number;
  section: TutorialSection;
  type: number;
}

const API_TUTORIAL_DETAIL = "https://www.nowcoder.com/content/tutorial/detail";
const API_TUTORIAL_CATALOG = "https://www.nowcoder.com/content/tutorial/catalog";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_DELAY_MS = 200;
const DEFAULT_URL =
  "https://www.nowcoder.com/content/tutorial/detail/94/4206176d637541fa92c784a4f547e979";
const DEFAULT_CATALOG_ID = 94;

async function main() {
  const options = parseCli(process.argv.slice(2));
  await mkdir(options.outDir, { recursive: true });

  if (options.mode === "book") {
    await crawlWholeBook(options);
    return;
  }

  const rawPayload = await fetchTutorialDetail(options, options.pathId, options.uuid);
  const normalized = normalizeDetail(rawPayload);
  const baseName = `tutorial-${options.pathId}-${options.uuid}`;
  const rawPath = path.join(options.outDir, `${baseName}.raw.json`);
  const normalizedPath = path.join(options.outDir, `${baseName}.json`);
  const markdownPath = path.join(options.outDir, `${baseName}.md`);

  await writeFile(rawPath, JSON.stringify(rawPayload, null, 2), "utf8");
  await writeFile(normalizedPath, JSON.stringify(normalized, null, 2), "utf8");
  await writeFile(markdownPath, buildMarkdown(normalized), "utf8");

  console.log("[nowcoder] single tutorial detail fetched.");
  console.log(
    `[nowcoder] pathId=${options.pathId}, sectionId=${normalized.section.sectionId}, title=${normalized.section.title}`
  );
  console.log(`[nowcoder] raw json: ${rawPath}`);
  console.log(`[nowcoder] normalized json: ${normalizedPath}`);
  console.log(`[nowcoder] markdown: ${markdownPath}`);
}

async function crawlWholeBook(options: CliOptions) {
  const catalogRaw = await fetchTutorialCatalog(options, options.catalogId);
  const catalog = normalizeCatalog(catalogRaw);
  const sections = catalog.catalog.flat().filter((item) => Boolean(item.uuid));

  const bookDir = path.join(options.outDir, `book-${options.catalogId}`);
  await mkdir(bookDir, { recursive: true });
  await writeFile(path.join(bookDir, "catalog.raw.json"), JSON.stringify(catalogRaw, null, 2), "utf8");
  await writeFile(path.join(bookDir, "catalog.json"), JSON.stringify(catalog, null, 2), "utf8");

  const index: Array<{
    chapterId: number;
    chapterTitle: string;
    sectionId: number;
    title: string;
    uuid: string;
    fileBaseName: string;
  }> = [];

  console.log(`[nowcoder] catalog fetched. title=${catalog.title}, sections=${sections.length}`);

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const rawPayload = await fetchTutorialDetail(options, options.catalogId, section.uuid);
    const normalized = normalizeDetail(rawPayload);

    const fileBaseName = `${String(i + 1).padStart(3, "0")}-section-${normalized.section.sectionId}-${section.uuid}`;
    const rawPath = path.join(bookDir, `${fileBaseName}.raw.json`);
    const normalizedPath = path.join(bookDir, `${fileBaseName}.json`);
    const markdownPath = path.join(bookDir, `${fileBaseName}.md`);

    await writeFile(rawPath, JSON.stringify(rawPayload, null, 2), "utf8");
    await writeFile(normalizedPath, JSON.stringify(normalized, null, 2), "utf8");
    await writeFile(markdownPath, buildMarkdown(normalized), "utf8");

    index.push({
      chapterId: normalized.section.chapterId,
      chapterTitle: normalized.section.chapterTitle,
      sectionId: normalized.section.sectionId,
      title: normalized.section.title,
      uuid: section.uuid,
      fileBaseName
    });

    console.log(
      `[nowcoder] (${i + 1}/${sections.length}) sectionId=${normalized.section.sectionId}, title=${normalized.section.title}`
    );

    if (options.delayMs > 0 && i < sections.length - 1) {
      await sleep(options.delayMs);
    }
  }

  await writeFile(
    path.join(bookDir, "index.json"),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        catalogId: options.catalogId,
        tutorialId: catalog.tutorialId,
        title: catalog.title,
        catalogNum: catalog.catalogNum,
        sectionCount: index.length,
        sections: index
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`[nowcoder] book crawl done. saved dir: ${bookDir}`);
}

function parseCli(args: string[]): CliOptions {
  let mode: "single" | "book" = "single";
  let url = DEFAULT_URL;
  let catalogId = DEFAULT_CATALOG_ID;
  let cookie = process.env.NOWCODER_COOKIE?.trim() || undefined;
  let outDir = path.resolve(process.cwd(), "tmp", "nowcoder");
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  let delayMs = DEFAULT_DELAY_MS;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--url":
        url = (args[i + 1] || "").trim() || DEFAULT_URL;
        i += 1;
        break;
      case "--crawl-book":
        mode = "book";
        break;
      case "--catalog-id":
        catalogId = Number(args[i + 1] || DEFAULT_CATALOG_ID);
        i += 1;
        break;
      case "--cookie":
        cookie = (args[i + 1] || "").trim() || undefined;
        i += 1;
        break;
      case "--out-dir":
        outDir = path.resolve(process.cwd(), args[i + 1] || "tmp/nowcoder");
        i += 1;
        break;
      case "--timeout":
        timeoutMs = Number(args[i + 1]);
        i += 1;
        break;
      case "--delay":
        delayMs = Number(args[i + 1]);
        i += 1;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        break;
    }
  }

  timeoutMs = Number.isFinite(timeoutMs) && timeoutMs >= 1_000 ? Math.trunc(timeoutMs) : DEFAULT_TIMEOUT_MS;
  delayMs = Number.isFinite(delayMs) && delayMs >= 0 ? Math.trunc(delayMs) : DEFAULT_DELAY_MS;
  catalogId = Number.isFinite(catalogId) && catalogId > 0 ? Math.trunc(catalogId) : DEFAULT_CATALOG_ID;

  const parsed = parseTutorialPath(url);
  if (!parsed) {
    throw new Error("Invalid tutorial url. expected /content/tutorial/detail/{pathId}/{uuid}");
  }

  return {
    mode,
    url,
    pathId: parsed.pathId,
    uuid: parsed.uuid,
    catalogId,
    cookie,
    outDir,
    timeoutMs,
    delayMs
  };
}

function printHelp() {
  console.log(`
Usage:
  npm run nowcoder:crawl -- [options]

Options:
  --url <tutorial-url>     single mode url, default ${DEFAULT_URL}
  --crawl-book             crawl whole tutorial book by catalog
  --catalog-id <number>    catalog id for book mode, default ${DEFAULT_CATALOG_ID}
  --cookie <string>        nowcoder cookie, or env NOWCODER_COOKIE
  --out-dir <path>         output dir, default tmp/nowcoder
  --timeout <ms>           request timeout, default 20000
  --delay <ms>             delay between section requests, default 200
  --help                   show help

Examples:
  npm run nowcoder:crawl -- --url "${DEFAULT_URL}"
  npm run nowcoder:crawl -- --crawl-book --catalog-id 94
`);
}

function parseTutorialPath(url: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/content\/tutorial\/detail\/(\d+)\/([a-zA-Z0-9]+)/);
    if (!match) {
      return null;
    }
    return {
      pathId: Number(match[1]),
      uuid: match[2]
    };
  } catch {
    return null;
  }
}

async function fetchTutorialCatalog(options: CliOptions, catalogId: number): Promise<unknown> {
  return requestNowcoder({
    url: `${API_TUTORIAL_CATALOG}/${catalogId}?_=${Date.now()}`,
    timeoutMs: options.timeoutMs,
    cookie: options.cookie,
    method: "GET"
  });
}

async function fetchTutorialDetail(options: CliOptions, pathId: number, uuid: string): Promise<unknown> {
  return requestNowcoder({
    url: `${API_TUTORIAL_DETAIL}/${pathId}/${uuid}?_=${Date.now()}`,
    timeoutMs: options.timeoutMs,
    cookie: options.cookie,
    method: "GET"
  });
}

async function requestNowcoder(params: {
  url: string;
  timeoutMs: number;
  cookie?: string;
  method: "GET" | "POST";
  body?: string;
}) {
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Referer: "https://www.nowcoder.com/",
    Origin: "https://www.nowcoder.com"
  };
  if (params.cookie) {
    headers.Cookie = params.cookie;
  }

  const response = await fetch(params.url, {
    method: params.method,
    headers,
    body: params.body,
    signal: AbortSignal.timeout(params.timeoutMs)
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 280)}`);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "code") && Number(payload.code) !== 0) {
    const message = String(payload.msg ?? payload.message ?? "unknown error");
    throw new Error(`Nowcoder API code=${String(payload.code)} message=${message}`);
  }

  return payload;
}

function unwrapNowcoderData(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid nowcoder payload.");
  }
  const root = payload as Record<string, unknown>;
  return (root.data ?? root) as unknown;
}

function normalizeCatalog(payload: unknown): CatalogData {
  const data = unwrapNowcoderData(payload) as CatalogData;
  return {
    title: data.title,
    tutorialId: data.tutorialId,
    catalogNum: data.catalogNum,
    catalog: Array.isArray(data.catalog) ? data.catalog : []
  };
}

function normalizeDetail(payload: unknown) {
  const data = unwrapNowcoderData(payload) as TutorialDetailData;
  const section = data.section;
  const contentHtml = section?.content ?? "";

  return {
    fetchedAt: new Date().toISOString(),
    url: {
      sectionId: section.sectionId,
      uuid: section.uuid
    },
    entityType: data.entityType,
    entityId: data.entityId,
    type: data.type,
    section: {
      chapterId: section.chapterId,
      chapterTitle: section.chapterTitle,
      id: section.id,
      sectionId: section.sectionId,
      tutorialId: section.tutorialId,
      title: section.title,
      contentHtml,
      contentText: htmlToText(contentHtml),
      watchCount: section.watchCount,
      wordCount: section.wordCount,
      createTime: section.createTime
    }
  };
}

function buildMarkdown(normalized: ReturnType<typeof normalizeDetail>) {
  const lines: string[] = [];
  lines.push(`# ${normalized.section.title || "Tutorial Detail"}`);
  lines.push("");
  lines.push(`- sectionId: ${normalized.section.sectionId}`);
  lines.push(`- uuid: ${normalized.url.uuid}`);
  lines.push(`- chapter: ${normalized.section.chapterTitle || ""}`);
  lines.push(`- tutorialId: ${normalized.section.tutorialId}`);
  lines.push(`- watchCount: ${normalized.section.watchCount}`);
  lines.push(`- wordCount: ${normalized.section.wordCount}`);
  lines.push(`- fetchedAt: ${normalized.fetchedAt}`);
  lines.push("");
  lines.push("## Content");
  lines.push("");
  lines.push(normalized.section.contentText || "");
  return lines.join("\n");
}

function htmlToText(html?: string | null) {
  if (!html) {
    return "";
  }
  const $ = load(html);
  $("script,style,noscript").remove();
  const text = $.root().text();
  return text.replace(/\u00a0/g, " ").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[nowcoder] failed: ${message}`);
  process.exit(1);
});


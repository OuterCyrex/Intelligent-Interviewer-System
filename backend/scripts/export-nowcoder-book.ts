import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";

interface CliOptions {
  bookDir: string;
  outName: string;
}

interface BookIndexSection {
  chapterId: number;
  chapterTitle: string;
  sectionId: number;
  title: string;
  uuid: string;
  fileBaseName: string;
}

interface BookIndex {
  title: string;
  tutorialId: number;
  sectionCount: number;
  sections: BookIndexSection[];
}

interface SectionJson {
  section: {
    chapterId: number;
    chapterTitle: string;
    sectionId: number;
    title: string;
    contentHtml: string;
    wordCount: number;
  };
}

async function main() {
  const options = parseCli(process.argv.slice(2));
  const indexPath = path.join(options.bookDir, "index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8")) as BookIndex;

  const markdownParts: string[] = [];
  markdownParts.push(`# ${index.title}`);
  markdownParts.push("");
  markdownParts.push(`- tutorialId: ${index.tutorialId}`);
  markdownParts.push(`- sectionCount: ${index.sectionCount}`);
  markdownParts.push("");

  let currentChapterId = -1;

  for (const item of index.sections) {
    const sectionPath = path.join(options.bookDir, `${item.fileBaseName}.json`);
    const sectionJson = JSON.parse(await readFile(sectionPath, "utf8")) as SectionJson;
    const section = sectionJson.section;

    if (section.chapterId !== currentChapterId) {
      currentChapterId = section.chapterId;
      markdownParts.push(`## 第${section.chapterId}章 ${cleanText(section.chapterTitle)}`);
      markdownParts.push("");
    }

    markdownParts.push(`### ${cleanText(section.title)}`);
    markdownParts.push("");
    markdownParts.push(`- sectionId: ${section.sectionId}`);
    markdownParts.push(`- uuid: ${item.uuid}`);
    markdownParts.push(`- wordCount: ${section.wordCount}`);
    markdownParts.push("");
    markdownParts.push(...htmlToMarkdownBlocks(section.contentHtml));
    markdownParts.push("");
  }

  const mergedMarkdown = normalizeMarkdown(markdownParts.join("\n"));
  const markdownPath = path.join(options.bookDir, `${options.outName}.md`);
  const docxPath = path.join(options.bookDir, `${options.outName}.docx`);
  await writeFile(markdownPath, mergedMarkdown, "utf8");

  const doc = buildDocxFromMarkdown(mergedMarkdown);
  const docBuffer = await Packer.toBuffer(doc);
  await writeFile(docxPath, docBuffer);

  console.log(`[export-book] markdown: ${markdownPath}`);
  console.log(`[export-book] word: ${docxPath}`);
}

function parseCli(args: string[]): CliOptions {
  let bookDir = path.resolve(process.cwd(), "tmp", "nowcoder", "book-94");
  let outName = "book-merged";

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--book-dir":
        bookDir = path.resolve(process.cwd(), args[i + 1] || "");
        i += 1;
        break;
      case "--out-name":
        outName = (args[i + 1] || "").trim() || "book-merged";
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

  return { bookDir, outName };
}

function printHelp() {
  console.log(`
Usage:
  npm run nowcoder:export-book -- [options]

Options:
  --book-dir <path>      book folder path (contains index.json), default tmp/nowcoder/book-94
  --out-name <name>      output base filename, default book-merged
  --help                 show help

Output:
  <book-dir>/<out-name>.md
  <book-dir>/<out-name>.docx
`);
}

function htmlToMarkdownBlocks(contentHtml: string) {
  if (!contentHtml) {
    return [];
  }

  const $ = load(`<div id="root">${contentHtml}</div>`);
  const lines: string[] = [];

  $("#root")
    .contents()
    .each((_, node) => {
      const chunk = renderNodeToMarkdown($, node);
      if (chunk.length > 0) {
        lines.push(...chunk);
      }
    });

  return lines;
}

function renderNodeToMarkdown($: ReturnType<typeof load>, node: unknown): string[] {
  const element = node as { type?: string; name?: string };
  if (!element.type) {
    return [];
  }

  if (element.type === "text") {
    const text = cleanText($(node).text());
    return text ? [text, ""] : [];
  }

  const tag = (element.name || "").toLowerCase();
  const text = cleanText($(node).text());
  if (!text && tag !== "br") {
    return [];
  }

  if (tag === "h1") {
    return [`# ${text}`, ""];
  }
  if (tag === "h2") {
    return [`## ${text}`, ""];
  }
  if (tag === "h3") {
    return [`### ${text}`, ""];
  }
  if (tag === "h4") {
    return [`#### ${text}`, ""];
  }
  if (tag === "h5") {
    return [`##### ${text}`, ""];
  }
  if (tag === "h6") {
    return [`###### ${text}`, ""];
  }
  if (tag === "p") {
    return [text, ""];
  }
  if (tag === "pre") {
    return ["```text", $(node).text().trim(), "```", ""];
  }
  if (tag === "ul") {
    const lines = $(node)
      .find("> li")
      .map((_, li) => `- ${cleanText($(li).text())}`)
      .get()
      .filter(Boolean);
    return lines.length > 0 ? [...lines, ""] : [];
  }
  if (tag === "ol") {
    const lines = $(node)
      .find("> li")
      .map((idx, li) => `${idx + 1}. ${cleanText($(li).text())}`)
      .get()
      .filter(Boolean);
    return lines.length > 0 ? [...lines, ""] : [];
  }
  if (tag === "br") {
    return [""];
  }

  const lines: string[] = [];
  $(node)
    .contents()
    .each((_, child) => {
      lines.push(...renderNodeToMarkdown($, child));
    });
  return lines;
}

function cleanText(input: string) {
  return input
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMarkdown(content: string) {
  return content
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .concat("\n");
}

function buildDocxFromMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const paragraphs: Paragraph[] = [];

  let inCode = false;
  const codeBuffer: string[] = [];

  const flushCode = () => {
    if (codeBuffer.length === 0) {
      return;
    }
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: codeBuffer.join("\n"), font: "Consolas" })]
      })
    );
    codeBuffer.length = 0;
  };

  for (const rawLine of lines) {
    const line = rawLine ?? "";

    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    if (line.startsWith("# ")) {
      paragraphs.push(new Paragraph({ text: line.slice(2).trim(), heading: HeadingLevel.HEADING_1 }));
      continue;
    }
    if (line.startsWith("## ")) {
      paragraphs.push(new Paragraph({ text: line.slice(3).trim(), heading: HeadingLevel.HEADING_2 }));
      continue;
    }
    if (line.startsWith("### ")) {
      paragraphs.push(new Paragraph({ text: line.slice(4).trim(), heading: HeadingLevel.HEADING_3 }));
      continue;
    }
    if (line.startsWith("#### ")) {
      paragraphs.push(new Paragraph({ text: line.slice(5).trim(), heading: HeadingLevel.HEADING_4 }));
      continue;
    }

    if (/^- /.test(line)) {
      paragraphs.push(new Paragraph({ text: line.replace(/^- /, "").trim(), bullet: { level: 0 } }));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      paragraphs.push(new Paragraph({ text: line.replace(/^\d+\.\s+/, "").trim(), bullet: { level: 0 } }));
      continue;
    }

    paragraphs.push(new Paragraph({ text: line }));
  }

  flushCode();

  return new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[export-book] failed: ${message}`);
  process.exit(1);
});


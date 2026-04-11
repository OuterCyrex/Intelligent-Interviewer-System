interface MarkdownChunkOptions {
  title: string;
  markdown: string;
  tags: string[];
  maxChunkLength: number;
  overlap: number;
}

export interface MarkdownKnowledgeChunk {
  title: string;
  summary: string;
  content: string;
  tags: string[];
}

interface MarkdownSection {
  heading: string | null;
  body: string;
}

export function splitMarkdownIntoKnowledgeChunks(options: MarkdownChunkOptions) {
  const normalizedTitle = options.title.trim();
  const sections = splitIntoSections(options.markdown);
  const chunks: MarkdownKnowledgeChunk[] = [];

  for (const section of sections) {
    const sectionTitle = section.heading ? `${normalizedTitle} / ${section.heading}` : normalizedTitle;
    const body = cleanMarkdown(section.body);
    if (!body) {
      continue;
    }

    const segmented = chunkText(body, options.maxChunkLength, options.overlap);
    segmented.forEach((content, index) => {
      const title = segmented.length > 1 ? `${sectionTitle}（${index + 1}）` : sectionTitle;
      const summary = buildSummary(content);
      const tags = Array.from(new Set([
        ...options.tags,
        ...(section.heading ? extractHeadingTags(section.heading) : [])
      ]));

      chunks.push({
        title,
        summary,
        content,
        tags
      });
    });
  }

  if (chunks.length > 0) {
    return chunks;
  }

  const fallbackContent = cleanMarkdown(options.markdown);
  if (!fallbackContent) {
    return [];
  }

  return chunkText(fallbackContent, options.maxChunkLength, options.overlap).map((content, index, all) => ({
    title: all.length > 1 ? `${normalizedTitle}（${index + 1}）` : normalizedTitle,
    summary: buildSummary(content),
    content,
    tags: options.tags
  }));
}

function splitIntoSections(markdown: string): MarkdownSection[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: MarkdownSection[] = [];
  let currentHeading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (!body) {
      buffer = [];
      return;
    }

    sections.push({
      heading: currentHeading,
      body
    });
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1].trim();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return sections;
}

function cleanMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.trim())
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string, maxChunkLength: number, overlap: number) {
  const normalized = text.trim();
  if (normalized.length <= maxChunkLength) {
    return [normalized];
  }

  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChunkLength) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = paragraph.length <= maxChunkLength ? addOverlap(current, paragraph, overlap) : "";
    }

    if (!current && paragraph.length > maxChunkLength) {
      chunks.push(...sliceLongParagraph(paragraph, maxChunkLength, overlap));
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}

function addOverlap(previous: string, next: string, overlap: number) {
  const suffix = previous.slice(-overlap).trim();
  if (!suffix) {
    return next;
  }

  return `${suffix}\n\n${next}`;
}

function sliceLongParagraph(paragraph: string, maxChunkLength: number, overlap: number) {
  const chunks: string[] = [];
  let start = 0;

  while (start < paragraph.length) {
    const end = Math.min(start + maxChunkLength, paragraph.length);
    chunks.push(paragraph.slice(start, end).trim());
    if (end >= paragraph.length) {
      break;
    }
    start = Math.max(end - overlap, start + 1);
  }

  return chunks.filter(Boolean);
}

function buildSummary(content: string) {
  return content.length <= 120 ? content : `${content.slice(0, 119).trim()}…`;
}

function extractHeadingTags(heading: string) {
  return heading
    .split(/[\/|、，,：:\s]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

# RAG Knowledge Crawler

This script builds role-oriented interview knowledge for RAG in 4 steps:

1. crawl configured web sources
2. extract questions and topic evidence
3. generate markdown knowledge docs
4. import docs through `POST /knowledge/import-markdown`

## Files

- `scripts/rag-kb-builder.ts`: crawler and ingestion pipeline
- `scripts/rag-kb.config.example.json`: editable config template

## Quick Start

```bash
cd backend
npm run rag:kb:dry
```

Dry-run still crawls and generates markdown files in `backend/tmp/rag-kb`, but it does not call write APIs.

## Real Ingestion

```bash
cd backend
npm run rag:kb
```

By default this will:

- auto-create missing positions by slug
- import 3 docs per role
- rebuild embeddings for each role

## Common Commands

Run only one role:

```bash
npm run rag:kb -- --only java-backend-engineer
```

Override API base URL:

```bash
npm run rag:kb -- --api http://127.0.0.1:3000
```

Disable ingestion:

```bash
npm run rag:kb -- --no-ingest
```

Limit crawl pages:

```bash
npm run rag:kb -- --max-pages 8
```

Use custom config:

```bash
npm run rag:kb -- --config scripts/rag-kb.config.example.json
```

## Notes

- Respect site ToS and robots policy before adding any source.
- Prefer high-quality, stable pages over community low-signal pages.
- If a source blocks crawling, the script falls back to role seed questions so docs can still be generated.


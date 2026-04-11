import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export function loadBackendEnv() {
  const candidates = Array.from(new Set([
    resolve(process.cwd(), ".env"),
    resolve(__dirname, "..", ".env")
  ]));

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    applyEnvFile(readFileSync(candidate, "utf8"));
    break;
  }
}

function applyEnvFile(content: string) {
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const rawKey = line.slice(0, separatorIndex).trim();
    const key = rawKey.startsWith("export ") ? rawKey.slice("export ".length).trim() : rawKey;
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

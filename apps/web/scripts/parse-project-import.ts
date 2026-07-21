import { readFile } from "node:fs/promises";
import {
  parseProjectJsonToDocument,
  parseProjectMarkdownToJson,
} from "../src/features/projects/project-import-parser.ts";

const filePath = readFilePath(process.argv.slice(2));
const source = await readFile(filePath, "utf8");
const parsed = filePath.endsWith(".json")
  ? parseJsonSource(source)
  : parseProjectMarkdownToJson(source);

if (!parsed.ok) {
  console.error(`${parsed.code ?? "project_import_failed"}: ${parsed.message}`);
  process.exit(1);
}

console.log(`${JSON.stringify(parsed.data, null, 2)}\n`);

function readFilePath(args: string[]) {
  const fileFlagIndex = args.findIndex((arg) => arg === "--file");
  const filePath = fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : args[0];

  if (!filePath) {
    console.error("Usage: pnpm --dir apps/web project:import:parse -- --file path/to/project.md");
    process.exit(1);
  }

  return filePath;
}

function parseJsonSource(source: string) {
  try {
    return parseProjectJsonToDocument(JSON.parse(source));
  } catch {
    return {
      ok: false,
      code: "project_import_invalid",
      message: "Project import JSON could not be parsed.",
      category: "invalid_parameter",
      subject: "project",
      field: "structure",
      reason: "invalid_value",
    } as const;
  }
}

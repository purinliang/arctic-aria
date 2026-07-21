import { readFile } from "node:fs/promises";
import {
  parseRoutineJsonToDocument,
  parseRoutineMarkdownToJson,
} from "../../web/src/features/routines/routine-import-parser.ts";

const filePath = readFilePath(process.argv.slice(2));
const source = await readFile(filePath, "utf8");
const parsed = filePath.endsWith(".json")
  ? parseJsonSource(source)
  : parseRoutineMarkdownToJson(source);

if (!parsed.ok) {
  console.error(`${parsed.code ?? "routine_import_failed"}: ${parsed.message}`);
  process.exit(1);
}

console.log(`${JSON.stringify(parsed.data, null, 2)}\n`);

function readFilePath(args: string[]) {
  const fileFlagIndex = args.findIndex((arg) => arg === "--file");
  const filePath = fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : args[0];

  if (!filePath) {
    console.error(
      "Usage: pnpm --dir apps/cli routine:parse -- --file templates/routine-import.md",
    );
    process.exit(1);
  }

  return filePath;
}

function parseJsonSource(source: string) {
  try {
    return parseRoutineJsonToDocument(JSON.parse(source));
  } catch {
    return {
      ok: false,
      code: "routine_import_invalid",
      message: "Routine import JSON could not be parsed.",
      category: "invalid_parameter",
      subject: "routine",
      field: "structure",
      reason: "invalid_value",
    } as const;
  }
}

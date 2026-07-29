import type {
  TemplateOperation,
  TemplatePreviewOperation,
} from "../template-parser.ts";
import type { RoutineRuleInput } from "./server/routine-repository.ts";

export type RoutineTemplateOperation = TemplateOperation;
export type RoutineTemplatePreviewOperation = TemplatePreviewOperation;

export type RoutineTemplatePreviewItem = {
  operation: RoutineTemplatePreviewOperation;
  title: string;
};

export type RoutineTemplatePreview = {
  items: RoutineTemplatePreviewItem[];
  counts: Record<RoutineTemplatePreviewOperation, number>;
  ignoredFieldCount: number;
};

export type RoutineTemplateParseData = {
  preview: RoutineTemplatePreview;
};

export type RoutineTemplateSaveCommand = {
  operation: "create" | "update";
  previewOperation: "create" | "update" | "preserve";
  routineId: string | null;
  groupId: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationMinutes: number | null;
  rule: RoutineRuleInput;
};

export type RoutineTemplateDeleteCommand = {
  operation: "delete";
  previewOperation: "delete";
  routineId: string;
  title: string;
};

export type RoutineTemplateCommand =
  | RoutineTemplateSaveCommand
  | RoutineTemplateDeleteCommand;

export type NormalizedRoutineTemplate = {
  commands: RoutineTemplateCommand[];
  preview: RoutineTemplatePreview;
};

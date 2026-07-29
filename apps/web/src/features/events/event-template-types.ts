import type {
  TemplateOperation,
  TemplatePreviewOperation,
} from "../template-parser.ts";

export type EventTemplateOperation = TemplateOperation;
export type EventTemplatePreviewOperation = TemplatePreviewOperation;

export type EventTemplatePreviewItem = {
  operation: EventTemplatePreviewOperation;
  title: string;
};

export type EventTemplatePreview = {
  items: EventTemplatePreviewItem[];
  counts: Record<EventTemplatePreviewOperation, number>;
  ignoredFieldCount: number;
};

export type EventTemplateParseData = {
  preview: EventTemplatePreview;
};

export type EventTemplateSaveCommand = {
  operation: "create" | "update";
  previewOperation: "create" | "update" | "preserve";
  eventId: string | null;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string;
  estimatedDurationHours: number | null;
  location: string | null;
};

export type EventTemplateDeleteCommand = {
  operation: "delete";
  previewOperation: "delete";
  eventId: string;
  title: string;
};

export type EventTemplateCommand =
  | EventTemplateSaveCommand
  | EventTemplateDeleteCommand;

export type NormalizedEventTemplate = {
  commands: EventTemplateCommand[];
  preview: EventTemplatePreview;
};

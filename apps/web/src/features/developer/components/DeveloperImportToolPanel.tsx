"use client";

// Settings Page - Import from Templates Panel.
import { FileInput, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { FieldLabel } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { SupportingText } from "@/components/text";
import type { SettingsMessages } from "@/messages/app-messages";
import {
  detectDeveloperImportTarget,
  developerImportPromptFor,
  type DeveloperImportTarget,
} from "../import-template-prompts";

type ImportAction = "parse" | "import";

export function DeveloperImportToolPanel({
  darkMode,
  messages,
  onImportComplete,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  messages: SettingsMessages;
  onImportComplete: (target: DeveloperImportTarget) => void;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [source, setSource] = useState("");
  const [pendingAction, setPendingAction] = useState<ImportAction | null>(null);
  const [result, setResult] = useState<unknown | null>(null);

  const resultText = useMemo(
    () => (result ? JSON.stringify(result, null, 2) : ""),
    [result],
  );

  async function runImportTool(action: ImportAction) {
    if (pendingAction) {
      return;
    }

    const trimmedSource = source.trim();

    if (!trimmedSource) {
      showErrorNotification(
        messages.developerImport.emptyInputMessage,
        messages.developerImport.emptyInputTitle,
      );
      return;
    }

    const target = detectDeveloperImportTarget(trimmedSource);

    if (!target || target === "ambiguous") {
      showErrorNotification(
        target === "ambiguous"
          ? messages.developerImport.ambiguousInputMessage
          : messages.developerImport.unknownInputMessage,
        messages.developerImport.unknownInputTitle,
      );
      return;
    }

    setPendingAction(action);

    try {
      const response = await fetch(`/api/developer/${target}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: importRequestBody(trimmedSource),
      });
      const payload = await readJsonResponse(response);

      setResult(payload);

      if (!response.ok || isFailurePayload(payload)) {
        showErrorNotification(
          failureMessage(payload, messages.developerImport.failedFallbackMessage),
          messages.developerImport.failedTitle,
        );
        return;
      }

      if (action === "parse") {
        showSuccessNotification(
          messages.developerImport.parseSuccessMessage,
          messages.developerImport.parseSuccessTitle,
        );
      } else {
        showSuccessNotification(
          target === "projects"
            ? messages.developerImport.projectImportSuccessMessage
            : messages.developerImport.routineImportSuccessMessage,
          messages.developerImport.importSuccessTitle,
        );
        onImportComplete(target);
      }
    } catch {
      showErrorNotification(
        messages.developerImport.failedFallbackMessage,
        messages.developerImport.failedTitle,
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCopyTemplate(target: DeveloperImportTarget) {
    try {
      await navigator.clipboard.writeText(developerImportPromptFor(target));
      showSuccessNotification(
        messages.developerImport.templateCopiedMessage,
        messages.developerImport.templateCopiedTitle,
      );
    } catch {
      showErrorNotification(
        messages.developerImport.templateCopyFailedMessage,
        messages.developerImport.templateCopyFailedTitle,
      );
    }
  }

  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        darkMode={darkMode}
        icon={<FileInput size={18} aria-hidden="true" />}
        title={messages.developerImport.title}
        description={messages.developerImport.description}
      />
      <List darkMode={darkMode}>
        <ListItem darkMode={darkMode} layout="block">
          <div className="grid gap-3">
            <FieldLabel
              darkMode={darkMode}
              label={messages.developerImport.inputLabel}
            >
              <TextArea
                darkMode={darkMode}
                className="min-h-56 font-mono text-sm leading-6"
                value={source}
                placeholder={messages.developerImport.inputPlaceholder}
                spellCheck={false}
                onChange={(event) => setSource(event.target.value)}
              />
            </FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                darkMode={darkMode}
                onClick={() => void handleCopyTemplate("projects")}
              >
                {messages.developerImport.copyProjectTemplate}
              </Button>
              <Button
                darkMode={darkMode}
                onClick={() => void handleCopyTemplate("routines")}
              >
                {messages.developerImport.copyRoutineTemplate}
              </Button>
              <Button
                darkMode={darkMode}
                disabled={Boolean(pendingAction)}
                loading={pendingAction === "parse"}
                loadingIcon={
                  <LoaderCircle
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                }
                onClick={() => void runImportTool("parse")}
              >
                {pendingAction === "parse"
                  ? messages.developerImport.parsing
                  : messages.developerImport.parse}
              </Button>
              <Button
                darkMode={darkMode}
                tone="primary"
                disabled={Boolean(pendingAction)}
                loading={pendingAction === "import"}
                loadingIcon={
                  <LoaderCircle
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                }
                onClick={() => void runImportTool("import")}
              >
                {pendingAction === "import"
                  ? messages.developerImport.importing
                  : messages.developerImport.import}
              </Button>
            </div>
          </div>
        </ListItem>
        {result ? (
          <ListItem darkMode={darkMode} layout="block">
            <div className="grid gap-2">
              <SupportingText darkMode={darkMode}>
                {messages.developerImport.resultTitle}
              </SupportingText>
              <pre className="max-h-80 overflow-auto rounded-md border border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-bg)] p-3 text-sm leading-6 text-[var(--aa-secondary-text)]">
                {resultText}
              </pre>
            </div>
          </ListItem>
        ) : null}
      </List>
    </Panel>
  );
}

function importRequestBody(source: string) {
  if (source.startsWith("{") || source.startsWith("[")) {
    return source;
  }

  return JSON.stringify({
    format: "markdown",
    source,
  });
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      message: `Request failed with status ${response.status}.`,
    };
  }
}

function isFailurePayload(payload: unknown) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "ok" in payload &&
    (payload as { ok?: unknown }).ok === false
  );
}

function failureMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}

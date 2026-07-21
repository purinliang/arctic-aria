"use client";

// Settings Page - Developer Import Tool Items.
import { ClipboardCopy, FileInput, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { FieldLabel } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { ListItem, ListItemContent } from "@/components/list";
import { LabelText, SupportingText } from "@/components/text";
import type { SettingsMessages } from "@/messages/app-messages";
import {
  developerImportPromptFor,
  type DeveloperImportTarget,
} from "../import-template-prompts";

type ImportAction = "parse" | "import";

export function DeveloperImportToolItems({
  darkMode,
  messages,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  messages: SettingsMessages;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [target, setTarget] = useState<DeveloperImportTarget>("projects");
  const [source, setSource] = useState("");
  const [pendingAction, setPendingAction] = useState<ImportAction | null>(null);
  const [result, setResult] = useState<unknown | null>(null);

  const targetOptions = useMemo(
    () => [
      {
        value: "projects",
        label: messages.developerImport.project,
      },
      {
        value: "routines",
        label: messages.developerImport.routine,
      },
    ],
    [messages.developerImport.project, messages.developerImport.routine],
  );
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

  async function handleCopyTemplate() {
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
    <>
      <ListItem darkMode={darkMode} layout="block">
        <ListItemContent
          title={
            <span className="flex items-center gap-2">
              <FileInput size={14} aria-hidden="true" />
              <LabelText darkMode={darkMode}>
                {messages.developerImport.title}
              </LabelText>
            </span>
          }
          main={
            <div className="mt-3 grid gap-3">
              <SupportingText darkMode={darkMode}>
                {messages.developerImport.description}
              </SupportingText>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <FieldLabel
                  darkMode={darkMode}
                  label={messages.developerImport.subjectLabel}
                >
                  <SingleChoiceGroup
                    darkMode={darkMode}
                    options={targetOptions}
                    value={target}
                    onChange={(value) =>
                      setTarget(value as DeveloperImportTarget)
                    }
                  />
                </FieldLabel>
                <Button
                  darkMode={darkMode}
                  icon={<ClipboardCopy size={14} aria-hidden="true" />}
                  onClick={() => void handleCopyTemplate()}
                >
                  {messages.developerImport.copyTemplate}
                </Button>
              </div>
              <FieldLabel
                darkMode={darkMode}
                label={messages.developerImport.inputLabel}
              >
                <TextArea
                  darkMode={darkMode}
                  className="min-h-56 font-mono text-xs leading-5"
                  value={source}
                  placeholder={messages.developerImport.inputPlaceholder}
                  spellCheck={false}
                  onChange={(event) => setSource(event.target.value)}
                />
              </FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
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
          }
        />
      </ListItem>
      {result ? (
        <ListItem darkMode={darkMode} layout="block">
          <div className="grid gap-2">
            <SupportingText darkMode={darkMode}>
              {messages.developerImport.resultTitle}
            </SupportingText>
            <pre className="max-h-80 overflow-auto rounded-md border border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-bg)] p-3 text-xs leading-5 text-[var(--aa-secondary-text)]">
              {resultText}
            </pre>
          </div>
        </ListItem>
      ) : null}
    </>
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

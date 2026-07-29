// Projects Page - Project Tree Template Dialog.
import { ClipboardCopy, FileText, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import {
  DialogActionRow,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { templateInputMinHeightClass } from "@/components/control-layout";
import { FormSection, FormSections } from "@/components/forms/form-layout";
import { FieldLabel } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemTitle,
} from "@/components/list";
import { DescriptionText, LabelText, SupportingText } from "@/components/text";
import { PendingText } from "@/components/loading";
import type {
  ProjectTreeTemplateParseData,
  ProjectView,
} from "@/features/projects/actions";
import { projectTreeTemplateForProject } from "@/features/projects/project-tree-template-serializer";
import type { ProjectMessages } from "@/messages/app-messages";

type TemplateAction = "parse" | "apply";

export function ProjectTreeTemplateDialog({
  darkMode,
  pending,
  project,
  messages,
  onClose,
  onParse,
  onApply,
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView;
  messages: ProjectMessages["editor"]["template"];
  onClose: () => void;
  onParse: (
    projectId: string,
    source: string,
  ) => Promise<ProjectTreeTemplateParseData | null>;
  onApply: (projectId: string, source: string) => Promise<boolean>;
}) {
  const template = useMemo(() => projectTreeTemplateForProject(project), [project]);
  const [source, setSource] = useState(template);
  const [parsedSource, setParsedSource] = useState("");
  const [preview, setPreview] =
    useState<ProjectTreeTemplateParseData["preview"] | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [action, setAction] = useState<TemplateAction | null>(null);
  const busy = pending || action !== null;
  const hasFreshPreview = Boolean(preview && parsedSource === source);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(template);
      setCopyStatus(messages.copied);
    } catch {
      setCopyStatus(messages.copyFailed);
    }
  }

  async function parseTemplate() {
    if (action) {
      return;
    }

    setAction("parse");

    try {
      const result = await onParse(project.id, source);

      if (!result) {
        setParsedSource("");
        setPreview(null);
        return;
      }

      setParsedSource(source);
      setPreview(result.preview);
    } finally {
      setAction(null);
    }
  }

  async function applyTemplate() {
    if (action || !hasFreshPreview) {
      return;
    }

    setAction("apply");

    try {
      await onApply(project.id, source);
    } finally {
      setAction(null);
    }
  }

  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogFrame darkMode={darkMode} size="lg">
        <DialogHeader
          darkMode={darkMode}
          title={messages.title}
          closeLabel={messages.close}
          onClose={onClose}
        />
        <FormSections>
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <FormSection>
              <FieldLabel darkMode={darkMode} label={messages.inputLabel}>
                <TextArea
                  darkMode={darkMode}
                  className={`${templateInputMinHeightClass} font-mono text-sm leading-6`}
                  value={source}
                  disabled={busy}
                  placeholder={messages.inputPlaceholder}
                  spellCheck={false}
                  onChange={(event) => {
                    setSource(event.target.value);
                    setPreview(null);
                    setParsedSource("");
                  }}
                />
              </FieldLabel>
              {copyStatus ? (
                <SupportingText darkMode={darkMode}>{copyStatus}</SupportingText>
              ) : null}
            </FormSection>
            <TemplatePreview
              darkMode={darkMode}
              messages={messages}
              preview={preview}
            />
          </div>
        </FormSections>
        <DialogActionRow>
          <Button
            darkMode={darkMode}
            size="md"
            disabled={busy}
            className="w-full"
            icon={<ClipboardCopy size={14} aria-hidden="true" />}
            onClick={() => void copyTemplate()}
          >
            {messages.copyTemplate}
          </Button>
          <Button
            darkMode={darkMode}
            size="md"
            disabled={busy}
            className="w-full"
            icon={<FileText size={14} aria-hidden="true" />}
            onClick={() => void parseTemplate()}
          >
            {action === "parse" ? messages.parsing : messages.parse}
          </Button>
          <DialogPrimaryButton
            darkMode={darkMode}
            disabled={busy || !hasFreshPreview}
            icon={<Save size={14} aria-hidden="true" />}
            onClick={() => void applyTemplate()}
          >
            <PendingText
              active={action === "apply"}
              idleText={messages.apply}
              pendingText={messages.applying}
            />
          </DialogPrimaryButton>
        </DialogActionRow>
      </DialogFrame>
    </DialogOverlay>
  );
}

function TemplatePreview({
  darkMode,
  messages,
  preview,
}: {
  darkMode: boolean;
  messages: ProjectMessages["editor"]["template"];
  preview: ProjectTreeTemplateParseData["preview"] | null;
}) {
  if (!preview) {
    return (
      <section className="grid content-start gap-2">
        <LabelText darkMode={darkMode}>{messages.previewTitle}</LabelText>
        <DescriptionText darkMode={darkMode}>
          {messages.previewEmpty}
        </DescriptionText>
      </section>
    );
  }

  return (
    <section className="grid min-w-0 content-start gap-2">
      <div className="grid min-w-0 gap-1">
        <LabelText darkMode={darkMode}>{messages.previewTitle}</LabelText>
        <SupportingText darkMode={darkMode}>
          {messages.previewCounts(
            preview.counts.create,
            preview.counts.update,
            preview.counts.delete,
          )}
        </SupportingText>
      </div>
      <List darkMode={darkMode} className="max-h-[28rem] overflow-auto">
        {preview.items.map((item, index) => (
          <ListItem darkMode={darkMode} key={`${item.subject}-${index}`}>
            <ListItemContent
              title={
                <ListItemTitle size="compact">
                  {messages.previewItem(
                    messages.operations[item.operation],
                    messages.subjects[item.subject],
                    item.title,
                    item.location,
                  )}
                </ListItemTitle>
              }
            />
          </ListItem>
        ))}
      </List>
    </section>
  );
}

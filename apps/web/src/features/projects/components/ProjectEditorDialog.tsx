import { LoaderCircle, Save } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  FieldLabel,
  NumberInput,
  TextArea,
  TextInput,
} from "@/components/ui/input-field";
import { InlineMessage } from "@/components/ui/text";
import type {
  MilestoneInput,
  ProjectInput,
} from "@/features/projects/actions";
import { priorityOptions } from "./project-page-helpers";

export function ProjectEditorDialog({
  darkMode,
  pending,
  message,
  draft,
  setDraft,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  draft: ProjectInput;
  setDraft: Dispatch<SetStateAction<ProjectInput>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogShell
      darkMode={darkMode}
      pending={pending}
      message={message}
      title={draft.id ? "Edit project" : "Add project"}
      closeLabel="Close project editor"
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <FieldLabel darkMode={darkMode} label="Title">
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          disabled={pending}
          placeholder="Project title"
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Objective">
        <TextArea
          darkMode={darkMode}
          className="min-h-20"
          value={draft.objective}
          maxLength={500}
          disabled={pending}
          placeholder="What should this project accomplish?"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              objective: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Importance reason" optional>
        <TextArea
          darkMode={darkMode}
          className="min-h-20"
          value={draft.importanceReason}
          maxLength={1000}
          disabled={pending}
          placeholder="Why does this matter?"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              importanceReason: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <ProjectDateFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        setDraft={setDraft}
      />
    </DialogShell>
  );
}

export function MilestoneEditorDialog({
  darkMode,
  pending,
  message,
  draft,
  setDraft,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  draft: MilestoneInput;
  setDraft: Dispatch<SetStateAction<MilestoneInput>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogShell
      darkMode={darkMode}
      pending={pending}
      message={message}
      title={draft.id ? "Edit milestone" : "Add milestone"}
      closeLabel="Close milestone editor"
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <FieldLabel darkMode={darkMode} label="Title">
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          disabled={pending}
          placeholder="Milestone title"
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Objective" optional>
        <TextArea
          darkMode={darkMode}
          className="min-h-20"
          value={draft.objective}
          maxLength={500}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              objective: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <MilestoneDateFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        setDraft={setDraft}
      />
    </DialogShell>
  );
}

function ProjectDateFields({
  darkMode,
  pending,
  draft,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectInput;
  setDraft: Dispatch<SetStateAction<ProjectInput>>;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldLabel darkMode={darkMode} label="Start date">
          <TextInput
            darkMode={darkMode}
            value={draft.startDate}
            placeholder="YYYY-MM-DD"
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label="Deadline" optional>
          <TextInput
            darkMode={darkMode}
            value={draft.deadlineDate}
            placeholder="YYYY-MM-DD"
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                deadlineDate: event.target.value,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label="Duration days" optional>
          <NumberInput
            darkMode={darkMode}
            min={1}
            step={1}
            value={draft.expectedDurationDays}
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                expectedDurationDays: event.target.value,
              }))
            }
          />
        </FieldLabel>
      </div>
      <div className="grid gap-1.5">
        <span className="text-xs font-semibold">Priority</span>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((option) => (
            <Button
              key={option.value}
              darkMode={darkMode}
              size="xs"
              active={draft.priority === option.value}
              disabled={pending}
              onClick={() =>
                setDraft((current) => ({ ...current, priority: option.value }))
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}

function MilestoneDateFields({
  darkMode,
  pending,
  draft,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: MilestoneInput;
  setDraft: Dispatch<SetStateAction<MilestoneInput>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FieldLabel darkMode={darkMode} label="Start date" optional>
        <TextInput
          darkMode={darkMode}
          value={draft.startDate}
          placeholder="YYYY-MM-DD"
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({ ...current, startDate: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Deadline" optional>
        <TextInput
          darkMode={darkMode}
          value={draft.deadlineDate}
          placeholder="YYYY-MM-DD"
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              deadlineDate: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Duration days" optional>
        <NumberInput
          darkMode={darkMode}
          min={1}
          step={1}
          value={draft.expectedDurationDays}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              expectedDurationDays: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </div>
  );
}

function DialogShell({
  darkMode,
  pending,
  message,
  title,
  closeLabel,
  children,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  title: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogOverlay>
      <DialogBackdrop label={closeLabel} onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={title}
            closeLabel={closeLabel}
            onClose={onClose}
          />
          {message ? (
            <InlineMessage darkMode={darkMode} className="mb-3">
              {message}
            </InlineMessage>
          ) : null}
          <div className="grid gap-3">{children}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              darkMode={darkMode}
              tone="primary"
              type="submit"
              loading={pending}
              icon={<Save size={14} aria-hidden="true" />}
              loadingIcon={
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              }
            >
              Save
            </Button>
          </div>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}

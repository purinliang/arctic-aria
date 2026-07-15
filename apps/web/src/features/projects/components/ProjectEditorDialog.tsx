import { LoaderCircle, Save, Trash2 } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/button";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { DatePickerField } from "@/components/forms/date-picker-field";
import {
  DialogActionRow,
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { SelectInput } from "@/components/forms/selection-field";
import { TextArea } from "@/components/forms/text-area-field";
import type {
  MilestoneInput,
  ProjectInput,
} from "@/features/projects/actions";
import { projectDurationOptions } from "@/features/projects/project-duration";

export function ProjectEditorDialog({
  darkMode,
  pending,
  draft,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectInput;
  setDraft: Dispatch<SetStateAction<ProjectInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogShell
      darkMode={darkMode}
      pending={pending}
      title={draft.id ? "Edit project" : "Add project"}
      closeLabel="Close project editor"
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
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
      <FieldLabel darkMode={darkMode} label="Description">
        <TextArea
          darkMode={darkMode}
          className="min-h-28"
          value={draft.description}
          maxLength={1000}
          disabled={pending}
          placeholder="Describe the goal, context, and why it matters."
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
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
  draft,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: MilestoneInput;
  setDraft: Dispatch<SetStateAction<MilestoneInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogShell
      darkMode={darkMode}
      pending={pending}
      title={draft.id ? "Edit milestone" : "Add milestone"}
      closeLabel="Close milestone editor"
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
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
      <div className="grid gap-1.5">
        <span className="text-xs font-semibold">Timeline</span>
        <SingleChoiceGroup
          darkMode={darkMode}
          disabled={pending}
          value={draft.timelineType}
          options={[
            { value: "deadline", label: "Deadline" },
            { value: "duration", label: "Duration" },
          ]}
          onChange={(timelineType) =>
            setDraft((current) => ({
              ...current,
              timelineType: timelineType as ProjectInput["timelineType"],
              deadlineDate:
                timelineType === "duration" ? "" : current.deadlineDate,
            }))
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel darkMode={darkMode} label="Start date">
          <DatePickerField
            darkMode={darkMode}
            value={draft.startDate}
            placeholder="Select start date"
            disabled={pending}
            onChange={(startDate) =>
              setDraft((current) => ({
                ...current,
                startDate,
              }))
            }
          />
        </FieldLabel>
        {draft.timelineType === "deadline" ? (
          <FieldLabel darkMode={darkMode} label="Deadline">
            <DatePickerField
              darkMode={darkMode}
              value={draft.deadlineDate}
              placeholder="Select deadline"
              disabled={pending}
              onChange={(deadlineDate) =>
                setDraft((current) => ({
                  ...current,
                  deadlineDate,
                }))
              }
            />
          </FieldLabel>
        ) : (
          <FieldLabel darkMode={darkMode} label="Duration">
            <SelectInput
              darkMode={darkMode}
              value={draft.durationRange}
              disabled={pending}
              options={projectDurationOptions}
              onChange={(durationRange) =>
                setDraft((current) => ({
                  ...current,
                  durationRange: durationRange as ProjectInput["durationRange"],
                }))
              }
            />
          </FieldLabel>
        )}
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
    <>
      <div className="grid gap-1.5">
        <span className="text-xs font-semibold">Timeline</span>
        <SingleChoiceGroup
          darkMode={darkMode}
          disabled={pending}
          value={draft.timelineType}
          options={[
            { value: "deadline", label: "Deadline" },
            { value: "duration", label: "Duration" },
          ]}
          onChange={(timelineType) =>
            setDraft((current) => ({
              ...current,
              timelineType: timelineType as MilestoneInput["timelineType"],
              deadlineDate:
                timelineType === "duration" ? "" : current.deadlineDate,
            }))
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel darkMode={darkMode} label="Start date">
          <DatePickerField
            darkMode={darkMode}
            value={draft.startDate}
            placeholder="Select start date"
            disabled={pending}
            onChange={(startDate) =>
              setDraft((current) => ({ ...current, startDate }))
            }
          />
        </FieldLabel>
        {draft.timelineType === "deadline" ? (
          <FieldLabel darkMode={darkMode} label="Deadline">
            <DatePickerField
              darkMode={darkMode}
              value={draft.deadlineDate}
              placeholder="Select deadline"
              disabled={pending}
              onChange={(deadlineDate) =>
                setDraft((current) => ({
                  ...current,
                  deadlineDate,
                }))
              }
            />
          </FieldLabel>
        ) : (
          <FieldLabel darkMode={darkMode} label="Duration">
            <SelectInput
              darkMode={darkMode}
              value={draft.durationRange}
              disabled={pending}
              options={projectDurationOptions}
              onChange={(durationRange) =>
                setDraft((current) => ({
                  ...current,
                  durationRange:
                    durationRange as MilestoneInput["durationRange"],
                }))
              }
            />
          </FieldLabel>
        )}
      </div>
    </>
  );
}

function DialogShell({
  darkMode,
  pending,
  title,
  closeLabel,
  children,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  title: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
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
          <div className="grid gap-3">{children}</div>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
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
            </DialogPrimaryButton>
            {onDelete ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
                className="w-full"
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={onDelete}
              >
                Delete
              </Button>
            ) : null}
          </DialogActionRow>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}

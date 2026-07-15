import { LoaderCircle, Save } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/button";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { DatePickerField } from "@/components/forms/date-picker-field";
import {
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { NumberInput } from "@/components/forms/number-field";
import { SelectInput } from "@/components/forms/selection-field";
import { TextArea } from "@/components/forms/text-area-field";
import type {
  MilestoneInput,
  ProjectInput,
} from "@/features/projects/actions";
import { projectDurationOptions } from "@/features/projects/project-duration";
import { priorityOptions } from "./project-page-helpers";

export function ProjectEditorDialog({
  darkMode,
  pending,
  draft,
  setDraft,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectInput;
  setDraft: Dispatch<SetStateAction<ProjectInput>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogShell
      darkMode={darkMode}
      pending={pending}
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
      <FieldLabel darkMode={darkMode} label="Description">
        <TextArea
          darkMode={darkMode}
          className="min-h-28"
          value={draft.description}
          maxLength={1000}
          disabled={pending}
          placeholder="Objective: to ... How and why is it important to you?"
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
}: {
  darkMode: boolean;
  pending: boolean;
  draft: MilestoneInput;
  setDraft: Dispatch<SetStateAction<MilestoneInput>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogShell
      darkMode={darkMode}
      pending={pending}
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
      <div className="grid gap-1.5">
        <span className="text-xs font-semibold">Priority</span>
        <SingleChoiceGroup
          darkMode={darkMode}
          disabled={pending}
          value={draft.priority}
          options={priorityOptions}
          onChange={(priority) =>
            setDraft((current) => ({
              ...current,
              priority: priority as ProjectInput["priority"],
            }))
          }
        />
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
      <FieldLabel darkMode={darkMode} label="Deadline" optional>
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
  title,
  closeLabel,
  children,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
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

// Routines Page - Routine Group Manager Dialog.
import { Edit3, Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { textAreaMinHeightMdClass } from "@/components/control-layout";
import { useDefaultDescriptionPlaceholder } from "@/components/default-description-placeholder";
import {
  CrudEditorDialog,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import {
  ManagerDialogSection,
  ManagerList,
  ManagerListRow,
} from "@/components/manager-list";
import type { RoutineGroupOption } from "@/features/dashboard/types";
import type { RoutineGroupInput } from "@/features/routines/actions";
import type { RoutineMessages } from "@/messages/app-messages";

export function RoutineGroupManagerDialog({
  darkMode,
  pending,
  saving,
  groups,
  groupDraft,
  groupFormOpen,
  messages,
  setGroupDraft,
  onCloseEditor,
  onCloseForm,
  onOpenNew,
  onOpenEdit,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  groups: RoutineGroupOption[];
  groupDraft: RoutineGroupInput;
  groupFormOpen: boolean;
  messages: RoutineMessages["groups"];
  setGroupDraft: Dispatch<SetStateAction<RoutineGroupInput>>;
  onCloseEditor: () => void;
  onCloseForm: () => void;
  onOpenNew: () => void;
  onOpenEdit: (group: RoutineGroupOption) => void;
  onSubmit: () => void;
  onDelete: (group: RoutineGroupOption) => void;
}) {
  return (
    <>
      <DialogOverlay>
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={messages.manageTitle}
            closeLabel={messages.closeEditor}
            onClose={onCloseEditor}
          />
          <ManagerDialogSection
            darkMode={darkMode}
            title={messages.sectionTitle}
            action={
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Plus size={14} aria-hidden="true" />}
                onClick={onOpenNew}
              >
                {messages.new}
              </Button>
            }
          >
            <ManagerList
              darkMode={darkMode}
              emptyText={messages.noGroups}
              getItemKey={(group) => group.id}
              items={groups}
              messages={messages.pagination}
              renderItem={(group) => (
                <ManagerListRow
                  darkMode={darkMode}
                  title={group.name}
                  description={group.description || messages.noDescription}
                  action={
                    <Button
                      darkMode={darkMode}
                      disabled={pending}
                      icon={<Edit3 size={15} aria-hidden="true" />}
                      onClick={() => onOpenEdit(group)}
                    >
                      {messages.edit}
                    </Button>
                  }
                />
              )}
            />
          </ManagerDialogSection>
        </DialogFrame>
      </DialogOverlay>

      {groupFormOpen ? (
        <RoutineGroupFormDialog
          darkMode={darkMode}
          pending={pending}
          saving={saving}
          groupDraft={groupDraft}
          messages={messages}
          setGroupDraft={setGroupDraft}
          onClose={onCloseForm}
          onSubmit={onSubmit}
          onDelete={
            groupDraft.id
              ? () =>
                  onDelete({
                    id: groupDraft.id ?? "",
                    name: groupDraft.name,
                    description: groupDraft.description,
                  })
              : undefined
          }
        />
      ) : null}
    </>
  );
}

function RoutineGroupFormDialog({
  darkMode,
  pending,
  saving,
  groupDraft,
  messages,
  setGroupDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  groupDraft: RoutineGroupInput;
  messages: RoutineMessages["groups"];
  setGroupDraft: Dispatch<SetStateAction<RoutineGroupInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  const descriptionPlaceholder = useDefaultDescriptionPlaceholder(
    messages.defaults,
    groupDraft.name,
  );

  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={groupDraft.id ? messages.editTitle : messages.add}
      closeLabel={messages.closeForm}
      saveText={messages.save}
      savingText={messages.saving}
      deleteText={onDelete ? messages.delete : undefined}
      zIndex="z-[60]"
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
    >
      <FieldLabel darkMode={darkMode} label={messages.name}>
        <TextInput
          darkMode={darkMode}
          value={groupDraft.name}
          maxLength={80}
          placeholder={messages.namePlaceholder}
          disabled={pending}
          onChange={(event) =>
            setGroupDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <FieldLabel
        darkMode={darkMode}
        label={messages.descriptionLabel}
        optional
      >
        <TextArea
          darkMode={darkMode}
          className={textAreaMinHeightMdClass}
          value={groupDraft.description}
          maxLength={500}
          disabled={pending}
          placeholder={descriptionPlaceholder}
          onChange={(event) =>
            setGroupDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </CrudEditorDialog>
  );
}

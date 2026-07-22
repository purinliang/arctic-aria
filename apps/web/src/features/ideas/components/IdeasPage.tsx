// Ideas Page.
import { Lightbulb, PenLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SetStateAction } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText } from "@/components/text";
import { formatDateKey } from "@/components/forms/date-format";
import type { IdeaInput, IdeaPageItem } from "../actions";
import type { IdeaMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import { IdeaEditorDialog } from "./IdeaEditorDialog";

type IdeaResult = Promise<boolean>;
type DialogAction = "save" | "delete" | null;
type ConfirmationTarget = { id: string; rawText: string };

const emptyIdeaDraft: IdeaInput = {
  rawText: "",
};

export function IdeasPage({
  darkMode,
  ideas,
  loading,
  pending,
  messages,
  dateMessages,
  onIdeaSave,
  onIdeaDelete,
}: {
  darkMode: boolean;
  ideas: IdeaPageItem[];
  loading: boolean;
  pending: boolean;
  messages: IdeaMessages;
  dateMessages: DatePickerMessages;
  onIdeaSave: (input: IdeaInput) => IdeaResult;
  onIdeaDelete: (ideaId: string) => IdeaResult;
}) {
  const [ideaDraft, setIdeaDraft] = useState<IdeaInput | null>(null);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);

  function closeDialogs() {
    if (!pending && dialogAction === null) {
      setIdeaDraft(null);
      setConfirmationTarget(null);
    }
  }

  function updateIdeaDraft(next: SetStateAction<IdeaInput>) {
    setIdeaDraft((current) =>
      typeof next === "function" ? next(current ?? emptyIdeaDraft) : next,
    );
  }

  async function submitIdea() {
    if (!ideaDraft) {
      return;
    }

    setDialogAction("save");

    try {
      const saved = await onIdeaSave(ideaDraft);

      if (saved) {
        setIdeaDraft(null);
      }
    } finally {
      setDialogAction(null);
    }
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    setDialogAction("delete");

    try {
      const deleted = await onIdeaDelete(confirmationTarget.id);

      if (deleted) {
        setIdeaDraft(null);
        setConfirmationTarget(null);
      }
    } finally {
      setDialogAction(null);
    }
  }

  return (
    <>
      <Panel darkMode={darkMode}>
        <CardHeader
          darkMode={darkMode}
          icon={<Lightbulb size={18} aria-hidden="true" />}
          title={messages.page.title}
          description={messages.page.description}
          action={
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={() => setIdeaDraft(emptyIdeaDraft)}
            >
              {messages.page.new}
            </Button>
          }
        />
        <List darkMode={darkMode}>
          {loading ? (
            <ListItem darkMode={darkMode} layout="block">
              <DescriptionText darkMode={darkMode}>
                {messages.page.loading}
              </DescriptionText>
            </ListItem>
          ) : ideas.length > 0 ? (
            ideas.map((idea) => (
              <IdeaRow
                key={idea.id}
                darkMode={darkMode}
                idea={idea}
                messages={messages}
                dateMessages={dateMessages}
                onEdit={() =>
                  setIdeaDraft({
                    id: idea.id,
                    rawText: idea.rawText,
                  })
                }
              />
            ))
          ) : (
            <div className="px-4 py-4">
              <DescriptionText darkMode={darkMode}>
                {messages.page.empty}
              </DescriptionText>
            </div>
          )}
        </List>
      </Panel>

      {ideaDraft ? (
        <IdeaEditorDialog
          darkMode={darkMode}
          pending={pending || dialogAction !== null}
          saving={dialogAction === "save"}
          draft={ideaDraft}
          setDraft={updateIdeaDraft}
          messages={messages.editor}
          onClose={closeDialogs}
          onSubmit={() => void submitIdea()}
          onDelete={
            ideaDraft.id
              ? () =>
                  setConfirmationTarget({
                    id: ideaDraft.id ?? "",
                    rawText: ideaDraft.rawText || messages.confirm.fallbackIdea,
                  })
              : undefined
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending || dialogAction === "delete"}
          title={messages.confirm.title}
          description={messages.confirm.description(
            confirmationTarget.rawText,
          )}
          cancelText={messages.confirm.cancel}
          confirmText={messages.confirm.confirm}
          pendingConfirmText={messages.confirm.deleting}
          closeLabel={messages.confirm.close}
          confirmIcon={<Trash2 size={14} aria-hidden="true" />}
          onCancel={() => {
            if (!pending && dialogAction === null) {
              setConfirmationTarget(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}

function IdeaRow({
  darkMode,
  idea,
  messages,
  dateMessages,
  onEdit,
}: {
  darkMode: boolean;
  idea: IdeaPageItem;
  messages: IdeaMessages;
  dateMessages: DatePickerMessages;
  onEdit: () => void;
}) {
  const source = sourceLabel(idea.source, messages);
  const metadata = [
    source,
    messages.page.statusUntriaged,
    formatDateKey(idea.createdDate, dateMessages, idea.createdDate),
  ].filter(Boolean);

  return (
    <ListItem darkMode={darkMode}>
      <ListItemContent
        title={<ListItemTitle>{idea.rawText}</ListItemTitle>}
        support={
          <ListItemSupportingText>
            {metadata.join(" · ")}
          </ListItemSupportingText>
        }
      />
      <ListItemActions>
        <Button
          darkMode={darkMode}
          icon={<PenLine size={14} aria-hidden="true" />}
          onClick={onEdit}
        >
          {messages.page.edit}
        </Button>
      </ListItemActions>
    </ListItem>
  );
}

function sourceLabel(source: IdeaPageItem["source"], messages: IdeaMessages) {
  if (source === "discord") {
    return messages.page.sourceDiscord;
  }

  if (source === "web") {
    return messages.page.sourceWeb;
  }

  if (source === "mobile") {
    return messages.page.sourceMobile;
  }

  return messages.page.sourceAgent;
}

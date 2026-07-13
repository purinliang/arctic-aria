import { LoaderCircle, Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/ui/dialog";
import { FieldLabel, NumberInput } from "@/components/ui/input-field";
import { InlineMessage } from "@/components/ui/text";
import type { TaskProgressInput } from "@/features/tasks/actions";

export function TaskProgressDialog({
  darkMode,
  pending,
  message,
  progressDraft,
  setProgressDraft,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  progressDraft: TaskProgressInput;
  setProgressDraft: Dispatch<SetStateAction<TaskProgressInput | null>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogBackdrop label="Close progress editor" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode} size="sm">
          <DialogHeader
            darkMode={darkMode}
            title="Update progress"
            closeLabel="Close progress editor"
            onClose={onClose}
          />
          {message ? (
            <InlineMessage darkMode={darkMode} className="mb-3">
              {message}
            </InlineMessage>
          ) : null}
          <div className="grid gap-3">
            <FieldLabel darkMode={darkMode} label="Total weight">
              <NumberInput
                darkMode={darkMode}
                min={0.001}
                step={0.5}
                value={progressDraft.weight}
                disabled={pending}
                onChange={(event) =>
                  setProgressDraft((current) =>
                    current
                      ? { ...current, weight: Number(event.target.value) }
                      : current,
                  )
                }
              />
            </FieldLabel>
            <FieldLabel darkMode={darkMode} label="Completed weight">
              <NumberInput
                darkMode={darkMode}
                min={0}
                step={0.5}
                value={progressDraft.completedWeight}
                disabled={pending}
                onChange={(event) =>
                  setProgressDraft((current) =>
                    current
                      ? {
                          ...current,
                          completedWeight: Number(event.target.value),
                        }
                      : current,
                  )
                }
              />
            </FieldLabel>
          </div>
          <div className="mt-4 flex justify-end">
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

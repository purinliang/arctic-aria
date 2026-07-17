// Projects Page - Project Page Title.
import { ChevronDown, Edit3, Pin, PinOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { mutedTextClass, surfaceClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
import { cx } from "@/components/utils";
import type { ProjectView } from "@/features/projects/actions";
import type { ProjectDurationRange } from "@/features/projects/project-duration";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function ProjectPageTitle({
  darkMode,
  projects,
  selectedProjectId,
  editDisabled,
  pinPending = false,
  onBackToList,
  onProjectSelect,
  onEditProject,
  onPinProject,
  onUnpinProject,
  messages,
  timelineMessages,
  durationMessages,
  dateMessages,
}: {
  darkMode: boolean;
  projects: ProjectView[];
  selectedProjectId: string | null;
  editDisabled?: boolean;
  pinPending?: boolean;
  onBackToList: () => void;
  onProjectSelect: (projectId: string) => void;
  onEditProject?: (project: ProjectView) => void;
  onPinProject?: (projectId: string) => void;
  onUnpinProject?: (projectId: string) => void;
  messages: ProjectMessages["pageTitle"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  dateMessages: DatePickerMessages;
}) {
  const [open, setOpen] = useState(false);
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;
  const breadcrumbButtonClass =
    "hover:bg-[var(--aa-color-hover)] hover:text-[var(--aa-color-text)] hover:outline hover:outline-2 hover:outline-[var(--aa-color-hover)] focus-visible:bg-[var(--aa-color-hover)] focus-visible:text-[var(--aa-color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--aa-color-hover)]";

  if (!selectedProject) {
    return (
      <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
        {messages.projects}
      </h1>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <h1 className="flex min-w-0 items-center gap-2 text-2xl font-semibold tracking-normal sm:text-3xl">
        <button
          className={cx(
            "shrink-0 rounded-sm text-left outline-none transition",
            breadcrumbButtonClass,
          )}
          type="button"
          onClick={() => {
            setOpen(false);
            onBackToList();
          }}
        >
          {messages.projects}
        </button>
        <span className={cx("shrink-0", mutedTextClass(darkMode))}>/</span>
        <span className="relative min-w-0">
          <button
            className={cx(
              "flex min-w-0 max-w-[min(58vw,42rem)] items-center gap-2 rounded-sm text-left outline-none transition",
              breadcrumbButtonClass,
            )}
            type="button"
            aria-expanded={open}
            title={selectedProject.title}
            onClick={() => setOpen((current) => !current)}
          >
            <span className="block min-w-0 truncate">
              {selectedProject.title}
            </span>
            <ChevronDown
              className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
              size={20}
              aria-hidden="true"
            />
          </button>

          {open ? (
            <>
              <button
                className="fixed inset-0 z-20 cursor-default"
                type="button"
                aria-label={messages.closeSwitcher}
                onClick={() => setOpen(false)}
              />
              <div
                className={cx(
                  "absolute left-0 z-30 mt-2 max-h-[min(360px,60vh)] w-[min(520px,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-md border p-1 text-sm shadow-xl",
                  surfaceClass(darkMode),
                )}
              >
                {projects.map((project) => {
                  const active = project.id === selectedProject.id;

                  return (
                    <button
                      key={project.id}
                      className={cx(
                        "grid w-full gap-1 rounded-md px-3 py-2 text-left transition",
                        active
                          ? "bg-[var(--aa-color-selected)] text-[var(--aa-color-selected-text)]"
                          : "text-[var(--aa-color-text)] hover:bg-[var(--aa-color-hover)]",
                      )}
                      type="button"
                      title={project.title}
                      onClick={() => {
                        setOpen(false);
                        onProjectSelect(project.id);
                      }}
                    >
                      <span className="truncate font-semibold">
                        {project.title}
                      </span>
                      <span
                        className={cx(
                          "truncate text-xs",
                          active ? "" : mutedTextClass(darkMode),
                        )}
                      >
                        {projectTimelineText(
                          project,
                          timelineMessages,
                          durationMessages,
                          dateMessages,
                        )}{" "}
                        · {timelineMessages.progress(
                          doneTaskCount(project),
                          project.tasks.length,
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </span>
      </h1>
      {onEditProject ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            darkMode={darkMode}
            size="icon-sm"
            className="rounded-full"
            disabled={pinPending}
            aria-label={
              selectedProject.sidebarPinOrder !== null
                ? messages.unpin
                : messages.pin
            }
            icon={
              selectedProject.sidebarPinOrder !== null ? (
                <PinOff size={15} aria-hidden="true" />
              ) : (
                <Pin size={15} aria-hidden="true" />
              )
            }
            onClick={() => {
              if (selectedProject.sidebarPinOrder !== null) {
                onUnpinProject?.(selectedProject.id);
                return;
              }

              onPinProject?.(selectedProject.id);
            }}
          />
          <Button
            darkMode={darkMode}
            disabled={editDisabled}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={() => onEditProject(selectedProject)}
          >
            {messages.edit}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function projectTimelineText(
  project: ProjectView,
  messages: ProjectMessages["timeline"],
  durations: ProjectMessages["duration"],
  dateMessages: DatePickerMessages,
) {
  if (project.deadlineDate) {
    return messages.due(formatDate(project.deadlineDate, dateMessages));
  }

  if (project.expectedDurationDays) {
    return messages.expected(
      durations[project.durationRange as ProjectDurationRange],
    );
  }

  return messages.openEnded;
}

function doneTaskCount(project: ProjectView) {
  return project.tasks.filter((task) => task.status === "done").length;
}

function formatDate(value: string, messages: DatePickerMessages) {
  return formatDateKey(value, messages);
}

// Projects Page - Project Page Title.
import { ChevronDown, Edit3, Pin, PinOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { secondaryTextColorClass, panelColorClass } from "@/components/color";
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
    "hover:bg-[var(--aa-panel-hover-bg)] hover:text-[var(--aa-primary-text)] hover:outline hover:outline-2 hover:outline-[var(--aa-panel-hover-bg)] focus-visible:bg-[var(--aa-panel-hover-bg)] focus-visible:text-[var(--aa-primary-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--aa-panel-hover-bg)]";

  if (!selectedProject) {
    return (
      <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
        {messages.projects}
      </h1>
    );
  }

  const renderProjectSwitcher = () => (
    <ProjectSwitcher
      open={open}
      projects={projects}
      selectedProject={selectedProject}
      messages={messages}
      timelineMessages={timelineMessages}
      durationMessages={durationMessages}
      dateMessages={dateMessages}
      breadcrumbButtonClass={breadcrumbButtonClass}
      onOpenChange={setOpen}
      onProjectSelect={onProjectSelect}
    />
  );

  return (
    <>
      <div className="contents sm:hidden">
        <div className="col-start-2 flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-2xl font-semibold tracking-normal">
            <ProjectListButton
              className={breadcrumbButtonClass}
              label={messages.projects}
              onBackToList={onBackToList}
              onOpenChange={setOpen}
            />
            <span className={cx("shrink-0", secondaryTextColorClass)}>/</span>
          </div>
          <ProjectTitleActions
            darkMode={darkMode}
            editDisabled={editDisabled}
            messages={messages}
            pinPending={pinPending}
            project={selectedProject}
            onEditProject={onEditProject}
            onPinProject={onPinProject}
            onUnpinProject={onUnpinProject}
          />
        </div>
        <h1 className="col-span-2 min-w-0 text-2xl font-semibold tracking-normal">
          {renderProjectSwitcher()}
        </h1>
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
        <h1 className="flex min-w-0 items-center gap-2 text-3xl font-semibold tracking-normal">
          <ProjectListButton
            className={breadcrumbButtonClass}
            label={messages.projects}
            onBackToList={onBackToList}
            onOpenChange={setOpen}
          />
          <span className={cx("shrink-0", secondaryTextColorClass)}>/</span>
          {renderProjectSwitcher()}
        </h1>
        <ProjectTitleActions
          darkMode={darkMode}
          editDisabled={editDisabled}
          messages={messages}
          pinPending={pinPending}
          project={selectedProject}
          onEditProject={onEditProject}
          onPinProject={onPinProject}
          onUnpinProject={onUnpinProject}
        />
      </div>
    </>
  );
}

function ProjectListButton({
  className,
  label,
  onBackToList,
  onOpenChange,
}: {
  className: string;
  label: string;
  onBackToList: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <button
      className={cx(
        "shrink-0 rounded-sm text-left outline-none transition",
        className,
      )}
      type="button"
      onClick={() => {
        onOpenChange(false);
        onBackToList();
      }}
    >
      {label}
    </button>
  );
}

function ProjectSwitcher({
  open,
  projects,
  selectedProject,
  messages,
  timelineMessages,
  durationMessages,
  dateMessages,
  breadcrumbButtonClass,
  onOpenChange,
  onProjectSelect,
}: {
  open: boolean;
  projects: ProjectView[];
  selectedProject: ProjectView;
  messages: ProjectMessages["pageTitle"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  dateMessages: DatePickerMessages;
  breadcrumbButtonClass: string;
  onOpenChange: (open: boolean) => void;
  onProjectSelect: (projectId: string) => void;
}) {
  return (
    <span className="relative block min-w-0 max-w-full">
      <button
        className={cx(
          "flex w-full max-w-full min-w-0 items-center gap-2 rounded-sm text-left outline-none transition sm:w-auto sm:max-w-[min(58vw,42rem)]",
          breadcrumbButtonClass,
        )}
        type="button"
        aria-expanded={open}
        title={selectedProject.title}
        onClick={() => onOpenChange(!open)}
      >
        <span className="block min-w-0 truncate">{selectedProject.title}</span>
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
            onClick={() => onOpenChange(false)}
          />
          <div
            className={cx(
              "absolute left-0 z-30 mt-2 max-h-[min(360px,60vh)] w-[min(520px,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-md border p-1 text-sm shadow-xl",
              panelColorClass,
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
                      ? "bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)] hover:bg-[var(--aa-primary-button-hover-bg)] hover:text-[var(--aa-primary-button-hover-text)]"
                      : "text-[var(--aa-primary-text)] hover:bg-[var(--aa-secondary-button-hover-bg)]",
                  )}
                  type="button"
                  title={project.title}
                  onClick={() => {
                    onOpenChange(false);
                    onProjectSelect(project.id);
                  }}
                >
                  <span className="truncate font-semibold">
                    {project.title}
                  </span>
                  <span
                    className={cx(
                      "truncate text-xs",
                      active ? "" : secondaryTextColorClass,
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
  );
}

function ProjectTitleActions({
  darkMode,
  editDisabled,
  messages,
  pinPending,
  project,
  onEditProject,
  onPinProject,
  onUnpinProject,
}: {
  darkMode: boolean;
  editDisabled?: boolean;
  messages: ProjectMessages["pageTitle"];
  pinPending: boolean;
  project: ProjectView;
  onEditProject?: (project: ProjectView) => void;
  onPinProject?: (projectId: string) => void;
  onUnpinProject?: (projectId: string) => void;
}) {
  if (!onEditProject) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        darkMode={darkMode}
        size="icon-sm"
        className="rounded-full"
        disabled={pinPending}
        aria-label={
          project.sidebarPinOrder !== null ? messages.unpin : messages.pin
        }
        icon={
          project.sidebarPinOrder !== null ? (
            <PinOff size={15} aria-hidden="true" />
          ) : (
            <Pin size={15} aria-hidden="true" />
          )
        }
        onClick={() => {
          if (project.sidebarPinOrder !== null) {
            onUnpinProject?.(project.id);
            return;
          }

          onPinProject?.(project.id);
        }}
      />
      <Button
        darkMode={darkMode}
        disabled={editDisabled}
        icon={<Edit3 size={15} aria-hidden="true" />}
        onClick={() => onEditProject(project)}
      >
        {messages.edit}
      </Button>
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

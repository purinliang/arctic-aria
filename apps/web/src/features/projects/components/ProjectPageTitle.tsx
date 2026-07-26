// Projects Page - Project Page Title.
import { ChevronDown, Pin, PinOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { secondaryTextColorClass, panelColorClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
import { ScrollArea } from "@/components/scroll-area";
import { cx } from "@/components/utils";
import type { ProjectView } from "@/features/projects/actions";
import type { ProjectDurationRange } from "@/features/projects/project-duration";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function ProjectPageTitle({
  darkMode,
  projects,
  selectedProjectId,
  detailLevel,
  milestoneTitle,
  milestoneMetadata,
  pinPending = false,
  onBackToList,
  onProjectSelect,
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
  detailLevel: "project" | "milestone";
  milestoneTitle: string | null;
  milestoneMetadata: string | null;
  pinPending?: boolean;
  onBackToList: () => void;
  onProjectSelect: (projectId: string) => void;
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
      <div className="col-start-2 grid min-w-0 gap-1 sm:col-auto sm:flex-1">
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-normal sm:text-3xl">
          {messages.projects}
        </h1>
        <p
          className={cx("min-w-0 truncate text-sm", secondaryTextColorClass)}
          title={messages.description}
        >
          {messages.description}
        </p>
      </div>
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
      onProjectTitleClick={() => {
        setOpen(false);
        onProjectSelect(selectedProject.id);
      }}
    />
  );
  const isMilestoneDetail = detailLevel === "milestone";
  const mobileBreadcrumbClass = isMilestoneDetail
    ? "text-sm font-medium tracking-normal"
    : "text-2xl font-semibold tracking-normal";
  const mobileProjectTitleClass = isMilestoneDetail
    ? "col-span-2 min-w-0 text-sm font-medium tracking-normal"
    : "col-span-2 min-w-0 text-2xl font-semibold tracking-normal";
  const desktopProjectTitleClass = isMilestoneDetail
    ? "flex min-w-0 items-center gap-2 text-sm font-medium tracking-normal"
    : "flex min-w-0 items-center gap-2 text-3xl font-semibold tracking-normal";

  return (
    <>
      <div className="contents sm:hidden">
        <div className="col-start-2 flex min-w-0 items-center justify-between gap-2">
          <div className={cx("flex min-w-0 items-center gap-2", mobileBreadcrumbClass)}>
            <ProjectListButton
              className={breadcrumbButtonClass}
              label={messages.projects}
              onBackToList={onBackToList}
              onOpenChange={setOpen}
            />
            <span className={cx("shrink-0", secondaryTextColorClass)}>/</span>
          </div>
          <ProjectTitlePinAction
            darkMode={darkMode}
            pinPending={pinPending}
            project={selectedProject}
            messages={messages}
            onPinProject={onPinProject}
            onUnpinProject={onUnpinProject}
          />
        </div>
        <h1 className={mobileProjectTitleClass}>
          {renderProjectSwitcher()}
        </h1>
        {isMilestoneDetail && milestoneTitle ? (
          <div className="col-span-2 grid min-w-0 gap-1">
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-normal">
              {milestoneTitle}
            </h1>
            {milestoneMetadata ? (
              <p
                className={cx(
                  "min-w-0 truncate text-sm",
                  secondaryTextColorClass,
                )}
                title={milestoneMetadata}
              >
                {milestoneMetadata}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="hidden min-w-0 flex-1 items-start gap-3 sm:flex">
        <div className="grid min-w-0 flex-1 gap-1">
          {isMilestoneDetail ? (
            <div className={desktopProjectTitleClass}>
              <ProjectListButton
                className={breadcrumbButtonClass}
                label={messages.projects}
                onBackToList={onBackToList}
                onOpenChange={setOpen}
              />
              <span className={cx("shrink-0", secondaryTextColorClass)}>/</span>
              {renderProjectSwitcher()}
            </div>
          ) : (
            <h1 className={desktopProjectTitleClass}>
              <ProjectListButton
                className={breadcrumbButtonClass}
                label={messages.projects}
                onBackToList={onBackToList}
                onOpenChange={setOpen}
              />
              <span className={cx("shrink-0", secondaryTextColorClass)}>/</span>
              {renderProjectSwitcher()}
            </h1>
          )}
          {isMilestoneDetail && milestoneTitle ? (
            <div className="grid min-w-0 gap-1">
              <h1 className="min-w-0 truncate text-3xl font-semibold tracking-normal">
                {milestoneTitle}
              </h1>
              {milestoneMetadata ? (
                <p
                  className={cx(
                    "min-w-0 truncate text-sm",
                    secondaryTextColorClass,
                  )}
                  title={milestoneMetadata}
                >
                  {milestoneMetadata}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <ProjectTitlePinAction
          darkMode={darkMode}
          pinPending={pinPending}
          project={selectedProject}
          messages={messages}
          onPinProject={onPinProject}
          onUnpinProject={onUnpinProject}
        />
      </div>
    </>
  );
}

function ProjectTitlePinAction({
  darkMode,
  pinPending,
  project,
  messages,
  onPinProject,
  onUnpinProject,
}: {
  darkMode: boolean;
  pinPending: boolean;
  project: ProjectView;
  messages: ProjectMessages["pageTitle"];
  onPinProject?: (projectId: string) => void;
  onUnpinProject?: (projectId: string) => void;
}) {
  const isPinned = project.sidebarPinOrder !== null;

  if (!onPinProject && !onUnpinProject) {
    return null;
  }

  return (
    <Button
      darkMode={darkMode}
      size="icon-sm"
      className="rounded-full"
      disabled={pinPending}
      aria-label={isPinned ? messages.unpin : messages.pin}
      icon={
        isPinned ? (
          <PinOff size={15} aria-hidden="true" />
        ) : (
          <Pin size={15} aria-hidden="true" />
        )
      }
      onClick={() => {
        if (isPinned) {
          onUnpinProject?.(project.id);
          return;
        }

        onPinProject?.(project.id);
      }}
    />
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
  onProjectTitleClick,
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
  onProjectTitleClick: () => void;
}) {
  return (
    <span className="relative block min-w-0 max-w-full flex-1">
      <span className="flex w-full max-w-full min-w-0 items-center gap-1">
        <button
          className={cx(
            "block min-w-0 flex-1 truncate rounded-sm text-left outline-none transition",
            breadcrumbButtonClass,
          )}
          type="button"
          title={selectedProject.title}
          onClick={onProjectTitleClick}
        >
          {selectedProject.title}
        </button>
        <button
          className={cx(
            "inline-flex shrink-0 items-center justify-center rounded-sm outline-none transition",
            breadcrumbButtonClass,
          )}
          type="button"
          aria-expanded={open}
          aria-label={messages.closeSwitcher}
          onClick={() => onOpenChange(!open)}
        >
          <ChevronDown
            className={`transition ${open ? "rotate-180" : ""}`}
            size={20}
            aria-hidden="true"
          />
        </button>
      </span>

      {open ? (
        <>
          <button
            className="fixed inset-0 z-20 cursor-default"
            type="button"
            aria-label={messages.closeSwitcher}
            onClick={() => onOpenChange(false)}
          />
          <ScrollArea
            className={cx(
              "absolute left-0 z-30 mt-2 w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-md border p-1 text-sm shadow-xl",
              panelColorClass,
            )}
            viewportClassName="max-h-[min(360px,60vh)] overflow-x-hidden"
            contentClassName="grid"
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
          </ScrollArea>
        </>
      ) : null}
    </span>
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

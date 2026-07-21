// Projects Page - Project Page Title.
import { ChevronDown, Edit3, Info, Pin, PinOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { secondaryTextColorClass, panelColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import { ScrollArea } from "@/components/scroll-area";
import { DescriptionText, LabelText } from "@/components/text";
import { cx } from "@/components/utils";
import type { ProjectView } from "@/features/projects/actions";
import type { ProjectDurationRange } from "@/features/projects/project-duration";
import { projectOverviewTimelineMetadata } from "@/features/projects/project-overview-metadata";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function ProjectPageTitle({
  darkMode,
  projects,
  selectedProjectId,
  pinPending = false,
  onBackToList,
  onProjectSelect,
  onProjectEdit,
  onPinProject,
  onUnpinProject,
  messages,
  detailMessages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
}: {
  darkMode: boolean;
  projects: ProjectView[];
  selectedProjectId: string | null;
  pinPending?: boolean;
  onBackToList: () => void;
  onProjectSelect: (projectId: string) => void;
  onProjectEdit?: (project: ProjectView) => void;
  onPinProject?: (projectId: string) => void;
  onUnpinProject?: (projectId: string) => void;
  messages: ProjectMessages["pageTitle"];
  detailMessages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
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
  const timelineText = projectTimelineText(
    selectedProject,
    timelineMessages,
    durationMessages,
    dateMessages,
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
            messages={messages}
            detailMessages={detailMessages}
            timelineMessages={timelineMessages}
            durationMessages={durationMessages}
            defaultDescriptions={defaultDescriptions}
            dateMessages={dateMessages}
            pinPending={pinPending}
            project={selectedProject}
            onProjectEdit={onProjectEdit}
            onPinProject={onPinProject}
            onUnpinProject={onUnpinProject}
          />
        </div>
        <h1 className="col-span-2 min-w-0 text-2xl font-semibold tracking-normal">
          {renderProjectSwitcher()}
        </h1>
        <p className={cx("col-span-2 text-sm", secondaryTextColorClass)}>
          {timelineText}
        </p>
      </div>

      <div className="hidden min-w-0 flex-1 items-start gap-3 sm:flex">
        <div className="grid min-w-0 flex-1 gap-1">
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
          <p className={cx("text-sm", secondaryTextColorClass)}>
            {timelineText}
          </p>
        </div>
        <ProjectTitleActions
          darkMode={darkMode}
          messages={messages}
          detailMessages={detailMessages}
          timelineMessages={timelineMessages}
          durationMessages={durationMessages}
          defaultDescriptions={defaultDescriptions}
          dateMessages={dateMessages}
          pinPending={pinPending}
          project={selectedProject}
          onProjectEdit={onProjectEdit}
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
    <span className="relative block min-w-0 max-w-full flex-1">
      <button
        className={cx(
          "flex w-full max-w-full min-w-0 items-center gap-2 rounded-sm text-left outline-none transition",
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

function ProjectTitleActions({
  darkMode,
  messages,
  detailMessages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  pinPending,
  project,
  onProjectEdit,
  onPinProject,
  onUnpinProject,
}: {
  darkMode: boolean;
  messages: ProjectMessages["pageTitle"];
  detailMessages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  pinPending: boolean;
  project: ProjectView;
  onProjectEdit?: (project: ProjectView) => void;
  onPinProject?: (projectId: string) => void;
  onUnpinProject?: (projectId: string) => void;
}) {
  const [overviewOpen, setOverviewOpen] = useState(false);

  if (!onPinProject && !onUnpinProject && !onProjectEdit) {
    return null;
  }

  return (
    <div className="relative flex shrink-0 items-center gap-2">
      {onPinProject || onUnpinProject ? (
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
      ) : null}
      <Button
        darkMode={darkMode}
        size="icon-sm"
        className="rounded-full"
        aria-label={messages.projectInfo}
        icon={<Info size={15} aria-hidden="true" />}
        onClick={() => setOverviewOpen((current) => !current)}
      />
      {overviewOpen ? (
        <>
          <button
            className="fixed inset-0 z-20 cursor-default"
            type="button"
            aria-label={messages.closeProjectInfo}
            onClick={() => setOverviewOpen(false)}
          />
          <ProjectOverviewPopover
            darkMode={darkMode}
            project={project}
            detailMessages={detailMessages}
            timelineMessages={timelineMessages}
            durationMessages={durationMessages}
            defaultDescriptions={defaultDescriptions}
            dateMessages={dateMessages}
            onEdit={
              onProjectEdit
                ? () => {
                    setOverviewOpen(false);
                    onProjectEdit(project);
                  }
                : undefined
            }
          />
        </>
      ) : null}
    </div>
  );
}

function ProjectOverviewPopover({
  darkMode,
  project,
  detailMessages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onEdit,
}: {
  darkMode: boolean;
  project: ProjectView;
  detailMessages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onEdit?: () => void;
}) {
  const timelineMetadata = projectOverviewTimelineMetadata(
    project,
    {
      deadline: detailMessages.deadlineLabel,
      expectedDuration: detailMessages.expectedDuration,
      timeline: detailMessages.timeline,
      openEnded: timelineMessages.openEnded,
    },
    durationMessages,
    (value) => formatDate(value, dateMessages),
  );

  return (
    <div
      className={cx(
        "absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border p-4 text-left shadow-xl",
        panelColorClass,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="truncate text-base font-semibold">
          {detailMessages.projectOverviewTitle}
        </h2>
        {onEdit ? (
          <Button
            darkMode={darkMode}
            disabled={false}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={onEdit}
          >
            {detailMessages.edit}
          </Button>
        ) : null}
      </div>
      <div className="grid min-w-0 gap-3">
        <ProjectOverviewRow
          darkMode={darkMode}
          label={detailMessages.description}
          value={displayDescription(
            project.description,
            project.title,
            defaultDescriptions.project,
          )}
        />
        <ProjectOverviewRow
          darkMode={darkMode}
          label={detailMessages.startDate}
          value={formatDate(project.startDate, dateMessages)}
        />
        <ProjectOverviewRow
          darkMode={darkMode}
          label={timelineMetadata.label}
          value={timelineMetadata.value}
        />
      </div>
    </div>
  );
}

function ProjectOverviewRow({
  darkMode,
  label,
  value,
}: {
  darkMode: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <LabelText darkMode={darkMode}>{label}</LabelText>
      <DescriptionText darkMode={darkMode}>{value}</DescriptionText>
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

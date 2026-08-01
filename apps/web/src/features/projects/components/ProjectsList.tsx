// Projects Page - Projects List.
import { FolderKanban, Pin, PinOff, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import {
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
  ListItemTitleButton,
} from "@/components/list";
import { PagedList } from "@/components/paged-list";
import { Panel } from "@/components/panel";
import type { ProjectView } from "@/features/projects/actions";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import type { ProjectDurationRange } from "@/features/projects/project-duration";

const projectPageSize = 10;

export function ProjectsList({
  darkMode,
  loading,
  pending,
  projects,
  pendingProjectPinIds,
  messages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onViewProject,
  onPinProject,
  onUnpinProject,
  onAddProject,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  projects: ProjectView[];
  pendingProjectPinIds: string[];
  messages: ProjectMessages["list"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onViewProject: (projectId: string) => void;
  onPinProject: (projectId: string) => void;
  onUnpinProject: (projectId: string) => void;
  onAddProject: () => void;
}) {
  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        darkMode={darkMode}
        icon={<FolderKanban size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={15} aria-hidden="true" />}
            onClick={onAddProject}
          >
            {messages.new}
          </Button>
        }
      />

      <PagedList
        ariaLabel={messages.pagination.ariaLabel}
        darkMode={darkMode}
        emptyText={messages.empty}
        items={projects}
        loading={loading}
        loadingText={messages.loading}
        messages={messages.pagination}
        pageSize={projectPageSize}
        renderItem={(project) => (
          <ProjectListItem
            key={project.id}
            darkMode={darkMode}
            project={project}
            pinPending={pendingProjectPinIds.includes(project.id)}
            messages={messages}
            timelineMessages={timelineMessages}
            durationMessages={durationMessages}
            defaultDescriptions={defaultDescriptions}
            dateMessages={dateMessages}
            onView={() => onViewProject(project.id)}
            onPin={() => onPinProject(project.id)}
            onUnpin={() => onUnpinProject(project.id)}
          />
        )}
      />
    </Panel>
  );
}

function ProjectListItem({
  darkMode,
  project,
  pinPending,
  messages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onView,
  onPin,
  onUnpin,
}: {
  darkMode: boolean;
  project: ProjectView;
  pinPending: boolean;
  messages: ProjectMessages["list"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onView: () => void;
  onPin: () => void;
  onUnpin: () => void;
}) {
  const pinned = project.sidebarPinOrder !== null;

  return (
    <ListItem darkMode={darkMode} className="min-w-0 items-start">
      <ListItemContent
        title={
          <ListItemTitle>
            <ListItemTitleButton onClick={onView}>
              {project.title}
            </ListItemTitleButton>
          </ListItemTitle>
        }
        main={
          <ListItemDescription className="line-clamp-2">
            {displayDescription(
              project.description,
              project.title,
              defaultDescriptions.project,
            )}
          </ListItemDescription>
        }
        support={
          <ListItemSupportingText>
            {projectTimelineText(
              project,
              timelineMessages,
              durationMessages,
              dateMessages,
            )}{" "}
            ·{" "}
            {timelineMessages.progress(
              doneTaskCount(project),
              project.tasks.length,
            )}
          </ListItemSupportingText>
        }
      />
      <ListItemActions>
        <Button
          darkMode={darkMode}
          size="icon"
          className="rounded-full"
          disabled={pinPending}
          aria-label={pinned ? messages.unpin : messages.pin}
          icon={
            pinned ? (
              <PinOff size={14} aria-hidden="true" />
            ) : (
              <Pin size={14} aria-hidden="true" />
            )
          }
          onClick={pinned ? onUnpin : onPin}
        />
      </ListItemActions>
    </ListItem>
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

// Projects Page - Projects List.
import { ChevronRight, FolderKanban, Pin, PinOff, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { ProjectView } from "@/features/projects/actions";

export function ProjectsList({
  darkMode,
  loading,
  pending,
  projects,
  pendingProjectPinIds,
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
  onViewProject: (projectId: string) => void;
  onPinProject: (projectId: string) => void;
  onUnpinProject: (projectId: string) => void;
  onAddProject: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<FolderKanban size={18} aria-hidden="true" />}
        title="Projects"
        description="Track long-running goals and the tasks that move them forward."
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={15} aria-hidden="true" />}
            onClick={onAddProject}
          >
            New
          </Button>
        }
      />

      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text="Loading projects..." />
        ) : null}
        {!loading && projects.length === 0 ? (
          <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
            No projects yet. Add a project for a larger goal.
          </p>
        ) : null}
        {projects.map((project) => (
          <ProjectListItem
            key={project.id}
            darkMode={darkMode}
            project={project}
            pinPending={pendingProjectPinIds.includes(project.id)}
            onView={() => onViewProject(project.id)}
            onPin={() => onPinProject(project.id)}
            onUnpin={() => onUnpinProject(project.id)}
          />
        ))}
      </List>
    </Panel>
  );
}

function ProjectListItem({
  darkMode,
  project,
  pinPending,
  onView,
  onPin,
  onUnpin,
}: {
  darkMode: boolean;
  project: ProjectView;
  pinPending: boolean;
  onView: () => void;
  onPin: () => void;
  onUnpin: () => void;
}) {
  const pinned = project.sidebarPinOrder !== null;

  return (
    <ListItem darkMode={darkMode} className="items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{project.title}</span>
        </div>
        <DescriptionText darkMode={darkMode} className="mt-1 line-clamp-2">
          {project.description}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="mt-2 block">
          {project.timelineText} · {project.progressText}
        </SupportingText>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          darkMode={darkMode}
          size="sm"
          disabled={pinPending}
          icon={
            pinned ? (
              <PinOff size={14} aria-hidden="true" />
            ) : (
              <Pin size={14} aria-hidden="true" />
            )
          }
          onClick={pinned ? onUnpin : onPin}
        >
          {pinned ? "Unpin" : "Pin"}
        </Button>
        <Button
          darkMode={darkMode}
          tone="ghost"
          size="icon-sm"
          aria-label={`Open ${project.title}`}
          icon={<ChevronRight size={16} aria-hidden="true" />}
          onClick={onView}
        />
      </div>
    </ListItem>
  );
}

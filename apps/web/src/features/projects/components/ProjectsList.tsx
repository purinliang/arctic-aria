// Projects Page - Projects List.
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { ProjectView } from "@/features/projects/actions";

export function ProjectsList({
  darkMode,
  loading,
  pending,
  projects,
  onViewProject,
  onAddProject,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  projects: ProjectView[];
  onViewProject: (projectId: string) => void;
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
          <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
            Loading projects...
          </p>
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
            onView={() => onViewProject(project.id)}
          />
        ))}
      </List>
    </Panel>
  );
}

function ProjectListItem({
  darkMode,
  project,
  onView,
}: {
  darkMode: boolean;
  project: ProjectView;
  onView: () => void;
}) {
  return (
    <ListItem darkMode={darkMode} layout="block">
      <button className="w-full text-left" type="button" onClick={onView}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{project.title}</span>
        </div>
        <DescriptionText darkMode={darkMode} className="mt-1 line-clamp-2">
          {project.description}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="mt-2 block">
          {project.timelineText} · {project.progressText}
        </SupportingText>
      </button>
    </ListItem>
  );
}

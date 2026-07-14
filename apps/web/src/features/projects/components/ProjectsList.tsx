import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  mutedTextClass,
  sectionBorderClass,
} from "@/components/ui/color";
import { ListItem } from "@/components/ui/list";
import { Tag } from "@/components/ui/tag";
import { cx } from "@/components/ui/utils";
import type { ProjectView } from "@/features/projects/actions";
import { titleCase } from "./project-page-helpers";

export function ProjectsList({
  darkMode,
  loading,
  pending,
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onEditProject,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  projects: ProjectView[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onAddProject: () => void;
  onEditProject: (project: ProjectView) => void;
}) {
  return (
    <section className="grid gap-3">
      <div
        className={cx(
          "flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3",
          sectionBorderClass(darkMode),
        )}
      >
        <div>
          <h2 className="text-base font-semibold">Projects</h2>
          <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
            Track long-running goals and the tasks that move them forward.
          </p>
        </div>
        <Button
          darkMode={darkMode}
          tone="primary"
          disabled={pending}
          icon={<Plus size={14} aria-hidden="true" />}
          onClick={onAddProject}
        >
          Add project
        </Button>
      </div>

      <div className="grid gap-2 px-4 pb-4">
        {loading ? (
          <p className={`text-sm ${mutedTextClass(darkMode)}`}>
            Loading projects...
          </p>
        ) : null}
        {!loading && projects.length === 0 ? (
          <p className={`text-sm ${mutedTextClass(darkMode)}`}>
            No projects yet. Add a project for a larger goal.
          </p>
        ) : null}
        {projects.map((project) => (
          <ProjectListItem
            key={project.id}
            darkMode={darkMode}
            project={project}
            selected={selectedProjectId === project.id}
            onSelect={() => onSelectProject(project.id)}
            onEdit={() => onEditProject(project)}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectListItem({
  darkMode,
  project,
  selected,
  onSelect,
  onEdit,
}: {
  darkMode: boolean;
  project: ProjectView;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <ListItem darkMode={darkMode} expanded={selected} layout="block">
      <button className="w-full text-left" type="button" onClick={onSelect}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{project.title}</span>
          <Tag darkMode={darkMode}>{titleCase(project.status)}</Tag>
          <Tag darkMode={darkMode}>{titleCase(project.priority)}</Tag>
        </div>
        <p className={`mt-1 line-clamp-2 text-sm ${mutedTextClass(darkMode)}`}>
          {project.description}
        </p>
        <div
          className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs ${mutedTextClass(darkMode)}`}
        >
          <span>{project.timelineText}</span>
          <span>{project.currentMilestone}</span>
          <span>{project.progressText}</span>
        </div>
      </button>
      {selected ? (
        <div className="mt-3">
          <Button darkMode={darkMode} size="xs" onClick={onEdit}>
            Edit project
          </Button>
        </div>
      ) : null}
    </ListItem>
  );
}

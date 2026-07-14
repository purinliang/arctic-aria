import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { mutedTextClass } from "@/components/ui/color";
import { List, ListItem } from "@/components/ui/list";
import { Panel } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import { cx } from "@/components/ui/utils";
import type { ProjectView } from "@/features/projects/actions";
import { titleCase } from "./project-page-helpers";

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
    <Panel darkMode={darkMode} className="min-h-[60vh]">
      <CardHeader
        darkMode={darkMode}
        icon={<FolderKanban size={18} aria-hidden="true" />}
        title="Projects"
        description="Track long-running goals and the tasks that move them forward."
        action={
          <Button
            darkMode={darkMode}
            tone="primary"
            disabled={pending}
            icon={<Plus size={15} aria-hidden="true" />}
            onClick={onAddProject}
          >
            Add project
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
        <div className="mt-3 grid gap-2">
          {project.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={cx(
                "grid gap-1 rounded-md border px-3 py-2",
                darkMode
                  ? "border-neutral-800 bg-black/40"
                  : "border-slate-200 bg-white",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold">{milestone.title}</span>
                <Tag darkMode={darkMode}>{titleCase(milestone.status)}</Tag>
              </div>
              <span className={`text-xs ${mutedTextClass(darkMode)}`}>
                {milestone.progressText}
              </span>
            </div>
          ))}
        </div>
      </button>
      <div className="mt-3">
        <Button
          darkMode={darkMode}
          size="xs"
          icon={<ArrowRight size={13} aria-hidden="true" />}
          onClick={onView}
        >
          View
        </Button>
      </div>
    </ListItem>
  );
}

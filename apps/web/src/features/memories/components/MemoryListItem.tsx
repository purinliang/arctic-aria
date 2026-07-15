import { Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { ListItem } from "@/components/list";
import { DescriptionText, SupportingText } from "@/components/text";
import type { MemoryRecord } from "@/features/dashboard/types";

export function MemoryListItem({
  memory,
  darkMode,
  onEdit,
}: {
  memory: MemoryRecord;
  darkMode: boolean;
  onEdit: () => void;
}) {
  const metadata = [
    memory.category,
    memory.pinned ? "Pinned" : "",
    memory.lastDoneText,
    `Done ${memory.doneCount} times`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListItem darkMode={darkMode} className="items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{memory.title}</h3>
        </div>
        <DescriptionText darkMode={darkMode} className="mt-1">
          {memory.description}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="mt-2 block">
          {metadata}
        </SupportingText>
      </div>
      <Button
        darkMode={darkMode}
        size="sm"
        icon={<Edit3 size={15} aria-hidden="true" />}
        onClick={onEdit}
      >
        Edit
      </Button>
    </ListItem>
  );
}

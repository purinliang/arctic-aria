// Memories Page - Categories Panel.
import { Album, Settings2 } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { Panel } from "@/components/panel";
import { cardBodyPaddingClass } from "@/components/spacing";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import type { MemoryMessages } from "@/messages/app-messages";
import { MemoryCategoryIcon } from "./MemoryCategoryIcon";
import {
  getMemoryCategoryLabel,
  getMemoryFilterNames,
  type MemoryFilter,
} from "./memory-page-helpers";

export function MemoryCategoriesPanel({
  darkMode,
  filter,
  categories,
  pending,
  messages,
  categoryMessages,
  onFilterChange,
  onManage,
}: {
  darkMode: boolean;
  filter: MemoryFilter;
  categories: MemoryCategoryOption[];
  pending: boolean;
  messages: MemoryMessages["panel"];
  categoryMessages: MemoryMessages["categories"]["builtIns"];
  onFilterChange: (filter: MemoryFilter) => void;
  onManage: () => void;
}) {
  const categoryByName = new Map(
    categories.map((category) => [category.name, category]),
  );

  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Album size={18} aria-hidden="true" />}
        title={messages.categoriesTitle}
        description={messages.categoriesDescription}
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Settings2 size={15} aria-hidden="true" />}
            onClick={onManage}
          >
            {messages.manage}
          </Button>
        }
      />
      <div className={cardBodyPaddingClass}>
        <SingleChoiceGroup
          darkMode={darkMode}
          value={filter}
          disabled={pending}
          options={getMemoryFilterNames(categories).map((item) => {
            const category = categoryByName.get(item);

            return {
              value: item,
              label:
                item === "All"
                  ? messages.all
                  : !category
                    ? item
                    : getMemoryCategoryLabel(
                        item,
                        category.builtInKey,
                        categoryMessages,
                      ),
              icon:
                item === "All" ? (
                  <Album size={14} aria-hidden="true" />
                ) : category ? (
                  <MemoryCategoryIcon iconName={category.iconName} />
                ) : undefined,
            };
          })}
          onChange={(value) => onFilterChange(value as MemoryFilter)}
        />
      </div>
    </Panel>
  );
}

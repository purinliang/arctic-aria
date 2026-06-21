import { Coins, Package, X } from "lucide-react";
import type { ReactNode } from "react";
import { rewardPreview } from "../dummy-data";
import type { ChestItemRarity, Routine, Task } from "../types";

function rarityClass(rarity: ChestItemRarity, darkMode: boolean) {
  if (rarity === "Legendary") {
    return darkMode ? "text-orange-300" : "text-orange-600";
  }

  if (rarity === "Epic") {
    return darkMode ? "text-purple-300" : "text-purple-600";
  }

  if (rarity === "Rare") {
    return darkMode ? "text-sky-300" : "text-blue-600";
  }

  if (rarity === "Uncommon") {
    return darkMode ? "text-emerald-300" : "text-emerald-600";
  }

  return darkMode ? "text-neutral-300" : "text-neutral-600";
}

export function ReviewDialog({
  tasks,
  routines,
  darkMode,
  open,
  reviewCount,
  gold,
  chestLevel,
  onClose,
}: {
  tasks: Task[];
  routines: Routine[];
  darkMode: boolean;
  open: boolean;
  reviewCount: number;
  gold: number;
  chestLevel: number;
  onClose: () => void;
}) {
  const completedTasks = tasks.filter((task) => task.status === "done");
  const partialTasks = tasks.filter((task) => task.status === "partial");
  const unfinishedTasks = tasks.filter((task) => task.status === "todo");
  const completedRoutines = routines.filter(
    (routine) => routine.status === "done",
  );
  const interruptedRoutines = routines.filter(
    (routine) => routine.status === "skipped",
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/65 px-4 py-16 sm:place-items-center sm:py-8">
      <section
        className={`max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-md border shadow-2xl ${
          darkMode
            ? "border-neutral-800 bg-black text-white"
            : "border-slate-200 bg-white text-slate-950"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
      >
        <div
          className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
            darkMode ? "border-neutral-800" : "border-slate-200"
          }`}
        >
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold uppercase ${
                darkMode ? "text-neutral-500" : "text-slate-500"
              }`}
            >
              Review run {reviewCount}
            </p>
            <h2 id="review-title" className="text-lg font-semibold">
              Current Review Card
            </h2>
          </div>
          <button
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition ${
              darkMode
                ? "border-neutral-800 hover:border-white"
                : "border-slate-300 hover:border-slate-500"
            }`}
            type="button"
            aria-label="Close review"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <RewardTile
              darkMode={darkMode}
              icon={<Coins size={18} aria-hidden="true" />}
              label="Gold"
              value={String(gold)}
            />
            <ChestTile darkMode={darkMode} level={chestLevel} />
          </div>

          <ReviewGroup
            darkMode={darkMode}
            title="Completed"
            items={[
              ...completedTasks.map((task) => task.title),
              ...completedRoutines.map((routine) => routine.title),
            ]}
            fallback="Nothing fully completed yet."
          />
          <ReviewGroup
            darkMode={darkMode}
            title="Partial Progress"
            items={partialTasks.map(
              (task) =>
                `${task.title}: ${task.completedWeight}/${task.weight} weight`,
            )}
            fallback="No partial progress recorded."
          />
          <ReviewGroup
            darkMode={darkMode}
            title="Unfinished or Skipped"
            items={[
              ...unfinishedTasks.map((task) => task.title),
              ...interruptedRoutines.map(
                (routine) => `${routine.title}: ${routine.status}`,
              ),
            ]}
            fallback="No unfinished or skipped items."
          />
        </div>
      </section>
    </div>
  );
}

function RewardTile({
  darkMode,
  icon,
  label,
  value,
}: {
  darkMode: boolean;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-md border p-3 ${
        darkMode
          ? "border-neutral-800 bg-neutral-950"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs font-medium uppercase ${
          darkMode ? "text-neutral-500" : "text-slate-500"
        }`}
      >
        {icon}
        {label}
      </div>
      <p className="mt-1 truncate text-xl font-semibold">{value}</p>
    </div>
  );
}

function ChestTile({ darkMode, level }: { darkMode: boolean; level: number }) {
  return (
    <div
      className={`group relative min-w-0 rounded-md border p-3 ${
        darkMode
          ? "border-neutral-800 bg-neutral-950"
          : "border-slate-200 bg-slate-50"
      }`}
      tabIndex={0}
    >
      <div
        className={`flex items-center gap-2 text-xs font-medium uppercase ${
          darkMode ? "text-neutral-500" : "text-slate-500"
        }`}
      >
        <Package size={18} aria-hidden="true" />
        Treasure Chest
      </div>
      <p className="mt-1 truncate text-xl font-semibold">
        {rewardPreview.chestName.replace("Lv 2", `Lv ${level}`)}
      </p>
      <div
        className={`pointer-events-none absolute right-0 top-[calc(100%+8px)] z-10 hidden w-64 rounded-md border p-3 shadow-xl group-hover:block group-focus:block ${
          darkMode
            ? "border-neutral-800 bg-black"
            : "border-slate-200 bg-white"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase ${
            darkMode ? "text-neutral-500" : "text-slate-500"
          }`}
        >
          Expected contents
        </p>
        <ul className="mt-2 grid gap-1 text-sm">
          {rewardPreview.chestItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="truncate">{item.name}</span>
              <span
                className={`shrink-0 font-semibold ${rarityClass(item.rarity, darkMode)}`}
              >
                {item.rarity}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReviewGroup({
  darkMode,
  title,
  items,
  fallback,
}: {
  darkMode: boolean;
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul
          className={`mt-2 grid gap-1 text-sm ${
            darkMode ? "text-neutral-300" : "text-slate-600"
          }`}
        >
          {items.map((item) => (
            <li
              key={item}
              className={`rounded-md px-2 py-1 ${
                darkMode ? "bg-neutral-950" : "bg-slate-50"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className={`mt-2 text-sm ${
            darkMode ? "text-neutral-500" : "text-slate-500"
          }`}
        >
          {fallback}
        </p>
      )}
    </section>
  );
}

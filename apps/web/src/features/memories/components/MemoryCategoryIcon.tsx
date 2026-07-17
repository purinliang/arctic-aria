// Memories Page - Memory Category Icon.
import {
  Bookmark,
  Film,
  Gamepad2,
  Landmark,
  Music,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  anime: Sparkles,
  bookmark: Bookmark,
  film: Film,
  gamepad: Gamepad2,
  landmark: Landmark,
  music: Music,
  shopping: ShoppingBag,
  utensils: Utensils,
};

export function MemoryCategoryIcon({
  iconName,
  size = 14,
}: {
  iconName: string;
  size?: number;
}) {
  const Icon = categoryIcons[iconName] ?? Bookmark;

  return <Icon size={size} aria-hidden="true" />;
}

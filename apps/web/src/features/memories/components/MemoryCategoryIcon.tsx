// Memories Page - Memory Category Icon.
import {
  Bookmark,
  BookOpenText,
  Film,
  Gamepad2,
  Landmark,
  Music,
  ShoppingCart,
  Sparkles,
  Trees,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  anime: Sparkles,
  bookmark: Bookmark,
  "book-open-text": BookOpenText,
  film: Film,
  gamepad: Gamepad2,
  "gamepad-2": Gamepad2,
  landmark: Landmark,
  music: Music,
  shopping: ShoppingCart,
  "shopping-cart": ShoppingCart,
  trees: Trees,
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

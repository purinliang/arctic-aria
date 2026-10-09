import { Bus, House, Tag, Receipt, ShoppingBag, Utensils, HeartPulse, Repeat } from 'lucide-react';
import type { SeedCategory } from '../types';

export function CategoryIcon({ category }: { category: SeedCategory | null }) {
  const Icon = category ? { food: Utensils,transport: Bus,shopping: ShoppingBag,housing: House,bills: Receipt,other: Tag,health: HeartPulse,subscription: Repeat }[category] : Tag;
  return <Icon size={20} aria-hidden="true" />;
}

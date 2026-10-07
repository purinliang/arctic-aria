import { Bus, House, MoreHorizontal, Receipt, ShoppingBag, Utensils } from 'lucide-react';
import type { SeedCategory } from '../types';

export function CategoryIcon({ category }: { category: SeedCategory }) {
  const Icon = { food: Utensils,transport: Bus,shopping: ShoppingBag,housing: House,bills: Receipt,other: MoreHorizontal,health: MoreHorizontal }[category];
  return <Icon size={20} aria-hidden="true" />;
}

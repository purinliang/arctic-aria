// Daily Life Page - Activity Icons.
import { Dumbbell, Moon, ShowerHead, Utensils } from 'lucide-react';
import type { LifeActivity } from '../types';

const icons = { meal: Utensils, shower: ShowerHead, sleep: Moon, exercise: Dumbbell };
export function ActivityIcon({ activity, size = 18 }: { activity: LifeActivity; size?: number }) {
  const Icon = icons[activity];
  return <Icon size={size} aria-hidden="true" />;
}

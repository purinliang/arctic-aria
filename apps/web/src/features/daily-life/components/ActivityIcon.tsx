// Daily Life Page - Activity Icons.
import { BriefcaseBusiness, BookOpen, Dumbbell } from 'lucide-react';
import type { LifeActivity } from '../types';

const icons = { work: BriefcaseBusiness, study: BookOpen, exercise: Dumbbell };
export function ActivityIcon({ activity, size = 18 }: { activity: LifeActivity; size?: number }) {
  const Icon = icons[activity];
  return <Icon size={size} aria-hidden="true" />;
}

import type { Metadata } from 'next';
import { RoadmapView } from '@/components/views';

export const metadata: Metadata = { title: 'Müfredat & Yol Haritası' };

export default function Page() {
  return <RoadmapView />;
}

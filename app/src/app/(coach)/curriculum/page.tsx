import type { Metadata } from 'next';
import { RoadmapView } from '@/components/views';

export const metadata: Metadata = { title: 'Curriculum & Roadmap', alternates: { canonical: '/curriculum' } };

export default function Page() {
  return <RoadmapView />;
}

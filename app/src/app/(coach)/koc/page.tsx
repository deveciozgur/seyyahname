import type { Metadata } from 'next';
import { CoachView } from '@/components/views';

export const metadata: Metadata = { title: 'Koç' };

export default function Page() {
  return <CoachView />;
}

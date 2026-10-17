import type { Metadata } from 'next';
import { CoachView } from '@/components/views';

export const metadata: Metadata = { title: 'Coach', alternates: { canonical: '/coach' } };

export default function Page() {
  return <CoachView />;
}

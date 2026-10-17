import type { Metadata } from 'next';
import { ArchiveView } from '@/components/views';

export const metadata: Metadata = { title: 'Arşiv' };

export default function Page() {
  return <ArchiveView />;
}

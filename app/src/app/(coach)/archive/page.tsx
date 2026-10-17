import type { Metadata } from 'next';
import { ArchiveView } from '@/components/views';

export const metadata: Metadata = { title: 'Archive' };

export default function Page() {
  return <ArchiveView />;
}

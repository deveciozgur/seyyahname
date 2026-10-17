import type { Metadata } from 'next';
import { StudioView } from '@/components/views';

export const metadata: Metadata = { title: 'Studio', alternates: { canonical: '/' } };

export default function Page() {
  return <StudioView />;
}

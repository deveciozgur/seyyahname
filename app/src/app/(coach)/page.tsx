import type { Metadata } from 'next';
import { StudioView } from '@/components/views';

export const metadata: Metadata = { title: 'Çalışma' };

export default function Page() {
  return <StudioView />;
}

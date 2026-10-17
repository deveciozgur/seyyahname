import type { Metadata } from 'next';
import { VaultView } from '@/components/views';

export const metadata: Metadata = { title: 'Kasa' };

export default function Page() {
  return <VaultView />;
}

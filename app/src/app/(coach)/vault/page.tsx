import type { Metadata } from 'next';
import { VaultView } from '@/components/views';

export const metadata: Metadata = { title: 'Vault', alternates: { canonical: '/vault' } };

export default function Page() {
  return <VaultView />;
}

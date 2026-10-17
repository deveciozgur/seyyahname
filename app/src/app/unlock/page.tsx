import type { Metadata } from 'next';
import Gatekeeper from '@/components/Gatekeeper';

// Anonymous on purpose: a neutral tab title and nothing on screen that names the site.
export const metadata: Metadata = { title: { absolute: 'Sign in' } };

const APP_PATHS = ['/', '/curriculum', '/vault', '/archive', '/coach'];

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const target = typeof next === 'string' && APP_PATHS.includes(next) ? next : '/';
  return <Gatekeeper next={target} />;
}

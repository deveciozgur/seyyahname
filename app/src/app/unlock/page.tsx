import type { Metadata } from 'next';
import Gatekeeper from '@/components/Gatekeeper';

// Anonymous on purpose: a neutral tab title and nothing on screen that names the site.
export const metadata: Metadata = { title: { absolute: 'Giriş' } };

const APP_PATHS = ['/', '/mufredat', '/kasa', '/arsiv', '/koc'];

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const target = typeof next === 'string' && APP_PATHS.includes(next) ? next : '/';
  return <Gatekeeper next={target} />;
}

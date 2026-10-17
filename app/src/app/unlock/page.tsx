import type { Metadata } from 'next';
import Gatekeeper from '@/components/Gatekeeper';
import { env } from '@/lib/server/env';

export const metadata: Metadata = { title: { absolute: 'Unlock · Seyyahname Studio' }, alternates: { canonical: '/unlock' } };

const APP_PATHS = ['/', '/curriculum', '/vault', '/archive', '/coach'];

/**
 * A numeric PIN of 4-8 digits gets the segmented digit boxes (with that many cells); any other secret
 * (letters, longer passphrases) gets a single masked field, so a strong APP_SECRET_PIN keeps working.
 */
function pinDigits(pin: string): number | null {
  return /^\d{4,8}$/.test(pin) ? pin.length : null;
}

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const target = typeof next === 'string' && APP_PATHS.includes(next) ? next : null;
  return <Gatekeeper next={target} digits={pinDigits(env.pin)} />;
}

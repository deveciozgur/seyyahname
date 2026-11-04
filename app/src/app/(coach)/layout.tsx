import CoachShell from '@/components/CoachShell';

// Render per request: a prerendered page goes out with s-maxage=31536000, and Hostinger's CDN then served the
// signed-in frame to signed-out visitors (skipping the proxy.ts gate) and would keep serving it after a deploy.
// Dynamic pages are sent as private, no-store.
export const dynamic = 'force-dynamic';

// Every signed-in page shares this frame (and its chat column); proxy.ts sends signed-out visitors to /unlock.
export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <CoachShell>{children}</CoachShell>;
}

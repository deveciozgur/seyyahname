import CoachShell from '@/components/CoachShell';

// Every signed-in page shares this frame (and its chat column); proxy.ts sends signed-out visitors to /unlock.
export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <CoachShell>{children}</CoachShell>;
}

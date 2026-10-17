'use client';

// Page bodies: each page of app/(coach) renders one of these; they take the profile and actions from
// the shared shell.
import { useCoach } from '@/components/CoachShell';
import Studio from '@/components/Studio';
import Roadmap from '@/components/Roadmap';
import Vault from '@/components/Vault';
import SessionsView from '@/components/SessionsView';
import CoachChat from '@/components/CoachChat';

export function StudioView() {
  const { profile, onActivitySaved, refreshKey } = useCoach();
  return <Studio profile={profile} onActivitySaved={onActivitySaved} refreshKey={refreshKey} />;
}

export function RoadmapView() {
  const { profile, onActivitySaved, refreshKey, rehearse, roadmapKey } = useCoach();
  return <Roadmap key={roadmapKey} profile={profile} onActivitySaved={onActivitySaved} onRehearse={rehearse} refreshKey={refreshKey} />;
}

export function VaultView() {
  const { profile, onActivitySaved, refreshKey } = useCoach();
  return <Vault refreshKey={refreshKey} profile={profile} onReviewed={onActivitySaved} />;
}

export function ArchiveView() {
  const { refreshKey } = useCoach();
  return <SessionsView refreshKey={refreshKey} />;
}

/** The chat as a page on smaller screens (wide screens show it in the right column instead). */
export function CoachView() {
  const { llm, wide } = useCoach();
  return wide ? null : <CoachChat llm={llm} />;
}

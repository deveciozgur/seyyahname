import type { Metadata } from 'next';
import Link from 'next/link';
import StatusScreen, { primaryAction, secondaryAction } from '@/components/StatusScreen';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StatusScreen code="404 · Not found" title="This page doesn't exist" message="The link may be outdated, or the page has moved. Your progress is safe.">
      <Link href="/" className={primaryAction}>
        Back to Studio
      </Link>
      <a href="https://seyyahname.com" rel="noopener noreferrer" className={secondaryAction}>
        Go to seyyahname.com
      </a>
    </StatusScreen>
  );
}

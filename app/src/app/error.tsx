'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import StatusScreen, { primaryAction, secondaryAction } from '@/components/StatusScreen';

/** A page crashed: show a calm screen with a retry instead of a blank page. Saved progress is on the server. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusScreen
      code={error.digest ? `Error · ${error.digest}` : 'Error'}
      title="Something went wrong"
      message="This screen hit an unexpected problem. Everything you saved is safe on the server. Try again, or head back to the Studio."
    >
      <button type="button" onClick={reset} className={primaryAction}>
        Try again
      </button>
      <Link href="/" className={secondaryAction}>
        Back to Studio
      </Link>
    </StatusScreen>
  );
}

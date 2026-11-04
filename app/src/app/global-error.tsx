'use client';

import { useEffect } from 'react';
import StatusScreen, { primaryAction, secondaryAction } from '@/components/StatusScreen';
import './globals.css';

/** Last resort when the root layout itself fails: replaces the whole document, so it renders <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <head>
        <title>Something went wrong · Seyyahname</title>
      </head>
      <body>
        <StatusScreen code={error.digest ? `Error · ${error.digest}` : 'Error'} title="Seyyahname couldn't load" message="Something failed while starting the app. Your saved progress is safe. Please try again.">
          <button type="button" onClick={reset} className={primaryAction}>
            Try again
          </button>
          {/* A full page load (not client navigation): the root layout is what broke. */}
          <a href="/" className={secondaryAction}>
            Back to Studio
          </a>
        </StatusScreen>
      </body>
    </html>
  );
}

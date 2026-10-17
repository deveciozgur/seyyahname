'use client';

import StatusScreen, { primaryAction } from '@/components/StatusScreen';
import './globals.css';

/** Last resort when the root layout itself fails: replaces the whole document, so it renders <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <StatusScreen code={error.digest ? `Error · ${error.digest}` : 'Error'} title="Seyyahname couldn't load" message="Something failed while starting the app. Your saved progress is safe. Please try again.">
          <button type="button" onClick={reset} className={primaryAction}>
            Try again
          </button>
        </StatusScreen>
      </body>
    </html>
  );
}

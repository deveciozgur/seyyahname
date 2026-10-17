import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { THEME_SCRIPT } from '@/lib/theme/script';
import './globals.css';

const NAME = 'Seyyahname AI Coach';
const DESCRIPTION = 'Seyyahname: Full-stack AI English learning coach featuring CEFR curriculum, SM-2 vocabulary system, and real-time streaming feedback.';

/** Canonical origin for OpenGraph/Twitter URLs: SITE_URL on the server, else localhost in development. */
function siteUrl(): URL {
  try {
    return new URL(process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export function generateMetadata(): Metadata {
  return {
    metadataBase: siteUrl(),
    applicationName: 'Seyyahname',
    title: { default: `Özgür Deveci | ${NAME}`, template: '%s | Seyyahname' },
    description: DESCRIPTION,
    openGraph: { type: 'website', siteName: 'Seyyahname', title: NAME, description: DESCRIPTION, locale: 'tr_TR', url: '/' },
    twitter: { card: 'summary_large_image', title: NAME, description: DESCRIPTION },
    // A private coaching app: shareable previews, but no search engine indexing.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { THEME_SCRIPT } from '@/lib/theme/script';
import './globals.css';

const NAME = 'Seyyahname AI Coach';
const DESCRIPTION = 'Seyyahname: Full-stack AI English learning coach featuring CEFR curriculum, SM-2 vocabulary system, and real-time streaming feedback.';

/**
 * Canonical origin for canonical/OpenGraph/Twitter URLs. Most pages are prerendered, so this is read at
 * build time: SITE_URL if set, the production domain for production builds, localhost in development.
 */
const PRODUCTION_URL = 'https://app.seyyahname.com';
function siteUrl(): URL {
  const fallback = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : `http://localhost:${process.env.PORT || 3000}`;
  try {
    return new URL(process.env.SITE_URL || fallback);
  } catch {
    return new URL(PRODUCTION_URL);
  }
}

export function generateMetadata(): Metadata {
  return {
    metadataBase: siteUrl(),
    applicationName: 'Seyyahname',
    title: { default: `Özgür Deveci | ${NAME}`, template: '%s | Seyyahname' },
    description: DESCRIPTION,
    openGraph: { type: 'website', siteName: 'Seyyahname', title: NAME, description: DESCRIPTION, locale: 'en_US', url: '/' },
    twitter: { card: 'summary_large_image', title: NAME, description: DESCRIPTION },
    // A private coaching app: shareable previews, but no search engine indexing.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Edge-to-edge on notched phones (content uses env(safe-area-inset-*)); on Android the layout
  // viewport shrinks with the virtual keyboard, so dvh-based screens stay fully visible.
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

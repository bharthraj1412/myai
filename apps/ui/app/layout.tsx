import type { Metadata, Viewport } from 'next'
import { Providers } from '@/providers'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: 'AG3NT | Personal AI Infrastructure',
    template: '%s | AG3NT',
  },
  description: 'AG3NT is a local-first personal AI infrastructure platform built around PAI primitives.',
  keywords: ['AG3NT', 'Personal AI Infrastructure', 'DeepAgents', 'memory', 'TELOS', 'skills', 'agents'],
  authors: [{ name: 'AG3NT Team' }],
  creator: 'AG3NT',
  metadataBase: new URL('https://ag3nt.local'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'AG3NT | Personal AI Infrastructure',
    description: 'A local-first personal AI infrastructure platform with algorithm, memory, TELOS, and agents.',
    siteName: 'AG3NT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AG3NT | Personal AI Infrastructure',
    description: 'A local-first personal AI infrastructure platform with algorithm, memory, TELOS, and agents.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  generator: 'AG3NT'
}

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

// Root layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}

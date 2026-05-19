import type { Metadata } from 'next'
import "@/app/globals.css";
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper'

export const metadata: Metadata = {
  title: 'RouteMed · Emergency Dispatch',
  description: 'Intelligent Emergency Medical Dispatch System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-secondary text-ink antialiased">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}
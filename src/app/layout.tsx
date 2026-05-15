import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import "@/app/globals.css";
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AmbulanceRoute Pune',
  description: 'Intelligent Emergency Medical Dispatch System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-secondary text-gray-900 antialiased`}>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/Header'
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MoleTracker - Monitor Your Skin Health',
  description: 'Track and monitor your moles over time for better skin health. Research tool powered by deep learning.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <MedicalDisclaimer />
          <Header />
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>
          <Toaster position="bottom-right" />
          <OnboardingModal />
        </div>
      </body>
    </html>
  )
}

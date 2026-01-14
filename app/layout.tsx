import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Steam Player Analyzer',
  description: 'Analysez votre profil Steam et recevez des recommandations de jeux personnalisées',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

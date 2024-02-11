import { cn } from '@/lib/utils'
import './globals.css'
import type { Metadata } from 'next'
import { Open_Sans } from 'next/font/google'
import NavBar from '@/components/Navbar'

const openSans = Open_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Content Crazy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        openSans.className, // First, applying the Open Sans font class
        'antialiased',
        'min-h-screen',
        'pt-16'
      )}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}

import './globals.css';
import SparklesIcon from "@/components/SparklesIcon";
import { Inter } from 'next/font/google';
import Link from "next/link";
  import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CaptionCraft',
  description: 'AI powered caption generator',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.className} bg-app-gradient min-h-screen text-white`}
        >
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md shadow-md">
            <div className="px-6 py-4">
              <div className="max-w-9xl mx-auto flex items-center justify-between">
                
                {/* Logo – Top Left */}
               <Link
  href="/"
  className="flex items-center gap-2 text-2xl sm:text-3xl font-semibold tracking-tight"
>
  <SparklesIcon />
  <span>AutoSub</span>
</Link>


                {/* Navigation – Top Right */}
                <nav className="flex items-center gap-8 text-sm sm:text-base font-medium text-white/80">

                  <Link href="/" className="text-white transition-colors">
                    Home
                  </Link>
                  <Link href="/pricing" className="text-white transition-colors">
                    Pricing
                  </Link>
                  <a
                    href="mailto:hammadkazi77@gmail.com"
                    className="text-white transition-colors"
                  >
                    Contact
                  </a>
                  
                  <SignedOut>
                    <Link href="/sign-in" className="bg-white/5 hover:bg-purple-500 text-white px-4 py-2 rounded-md transition-colors">
                      Sign In
                    </Link>
                  </SignedOut>
                  
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </nav>
              </div>
            </div>

            {/* Divider Line */}
            <div className="w-full h-px bg-white/20" />
          </header>

          {/* Page Content */}
          <main className="pt-28 px-2 max-w-xl mx-auto">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}

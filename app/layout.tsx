import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Playfair_Display, Lora, Dancing_Script } from 'next/font/google';
import { getUserFromSession } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import ThemeScript from "@/components/ui/ThemeScript";

export const metadata: Metadata = {
  title: "CookBook - Discover Amazing Recipes",
  description: "Join thousands of home cooks sharing their favorite recipes and culinary adventures. Discover, create, and share amazing recipes.",
  keywords: ["recipes", "cooking", "food", "home cooking", "meal ideas"],
  authors: [{ name: "CookBook Team" }],
  openGraph: {
    title: "CookBook - Discover Amazing Recipes",
    description: "Join thousands of home cooks sharing their favorite recipes",
    type: "website",
  },
};


const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-family-heading',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-family-body',
  display: 'swap',
});

const dancing = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-family-handwritten',
  display: 'swap',
});

export default async function RootLayout({ 
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromSession();
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${lora.variable} ${dancing.variable}`}>
      <body className="antialiased">
        {/* 
          Inline script to prevent theme flickering (FOUC - Flash of Unstyled Content).
          This script runs before React hydration to apply the saved theme from localStorage.
          suppressHydrationWarning on html element is used because the data-theme attribute is set by this script.
        */}
        <ThemeScript />
        <AuthProvider initialUser={user}>
          <Navbar /> 
        
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
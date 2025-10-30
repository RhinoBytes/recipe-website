import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Playfair_Display, Lora, Dancing_Script } from 'next/font/google';


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

export default function RootLayout({ 
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="terracotta" className={`${playfair.variable} ${lora.variable} ${dancing.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <Navbar /> 

          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
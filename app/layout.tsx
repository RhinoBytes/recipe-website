import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";



// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="terracotta">
      <body
        className="antialiased"
      >
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
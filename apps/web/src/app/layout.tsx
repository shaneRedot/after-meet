import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "../lib/store";

export const metadata: Metadata = {
  title: "After-Meet | AI-Powered Social Media Content Generator",
  description: "Automatically generate and post social media content from your meeting insights using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

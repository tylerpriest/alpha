import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaIntel - AI Knowledge Base for VC/PE",
  description: "Preserve institutional memory, search your knowledge base semantically, and get AI-powered answers with citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

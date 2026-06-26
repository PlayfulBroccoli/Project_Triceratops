import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Triceratops — Admin",
  description: "WhatsApp auto-reply control panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
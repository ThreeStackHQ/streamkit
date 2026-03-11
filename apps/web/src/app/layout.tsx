import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamKit",
  description: "Real-time event streaming for your apps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-brand-bg text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snake Game",
  description: "Classic Snake game built with Next.js - Control with arrow keys or WASD",
  keywords: ["snake game", "classic game", "javascript game", "browser game"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
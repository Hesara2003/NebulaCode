import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NebulaCode - Cloud IDE",
  description: "A high-complexity, full cloud-based development environment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

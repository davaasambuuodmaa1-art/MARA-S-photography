import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mara's Photography — An Art of Remembering",
    template: "%s · Mara's Photography",
  },
  description:
    "An atelier of intimate, editorial photography in Sydney — weddings, portraits, families, brands and sport. An art of remembering.",
  openGraph: {
    title: "Mara's Photography",
    description: "An art of remembering.",
    type: "website",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230a0908'/%3E%3Ctext x='16' y='23' font-family='Georgia,serif' font-size='18' fill='%23cdaf86' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap"
        />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

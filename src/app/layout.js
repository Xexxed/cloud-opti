import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AccessibilityTest from "@/components/accessibility/AccessibilityTest";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cloud Opti - Intelligent Cloud Architecture Optimization",
  description: "Optimize your cloud architecture with intelligent cost analysis and recommendations",
  keywords: "cloud optimization, cost analysis, architecture recommendations, AWS, Azure, GCP",
  author: "Cloud Opti Team",
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <AccessibilityTest />
        </ThemeProvider>
      </body>
    </html>
  );
}

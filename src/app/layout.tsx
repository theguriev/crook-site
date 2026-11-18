import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-familjen-grotesk",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const DESCRIPTION = "A terminal whose unit of work is an agent, not a tab. macOS, Linux and Windows, MIT.";

export const metadata: Metadata = {
  // Lets the card images and the canonical link be written as paths.
  metadataBase: new URL("https://crook.id"),
  title: {
    default: "Crook: a terminal whose unit of work is an agent",
    template: "%s · Crook",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Crook",
    title: "Crook: a terminal whose unit of work is an agent",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crook: a terminal whose unit of work is an agent",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050608" },
    { media: "(prefers-color-scheme: light)", color: "#f3f2ed" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${familjen.variable} ${plexSans.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-svh antialiased">
        <Analytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

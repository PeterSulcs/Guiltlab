import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RepoProvider } from "../lib/repoContext";
import { ThemeProvider } from "../lib/themeContext";
import { DateProvider } from "../lib/dateContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuiltLab - Repository Heatmap Aggregator",
  description: "Aggregate your contributions across multiple GitLab and GitHub instances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <DateProvider>
            <RepoProvider>
              {children}
            </RepoProvider>
          </DateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RepoProvider } from "../lib/repoContext";
import { ThemeProvider } from "../lib/themeContext";
import { DateProvider } from "../lib/dateContext";
import { TeamProvider } from "../lib/teamContext";
import Navbar from "@/components/Navbar";

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
              <TeamProvider>
                <div className="min-h-screen bg-background flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <footer className="bg-muted text-muted-foreground p-6">
                    <div className="container mx-auto text-center">
                      <p>&copy; {new Date().getFullYear()} GuiltLab - GitLab & GitHub Heatmap Aggregator</p>
                      <p className="opacity-70 text-sm mt-1">
                        Not affiliated with GitLab Inc. or GitHub Inc.
                      </p>
                    </div>
                  </footer>
                </div>
              </TeamProvider>
            </RepoProvider>
          </DateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

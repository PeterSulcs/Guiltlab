import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RepoProvider } from "../lib/repoContext";

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
    <html lang="en">
      <body className={inter.className}>
        <RepoProvider>
          {children}
        </RepoProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GitLabProvider } from "../lib/gitlabContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuiltLab - GitLab Heatmap Aggregator",
  description: "Aggregate your contributions across multiple GitLab instances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GitLabProvider>
          {children}
        </GitLabProvider>
      </body>
    </html>
  );
}

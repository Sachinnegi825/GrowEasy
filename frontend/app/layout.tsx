import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer — AI-Powered CRM Lead Import",
  description:
    "Upload any CSV from Facebook Leads, Google Ads, or spreadsheets. AI intelligently maps and extracts CRM data into GrowEasy format.",
  keywords: ["CRM", "CSV import", "lead management", "GrowEasy", "AI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#e11d48", secondary: "#fff" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}

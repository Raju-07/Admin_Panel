import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";
import ClientNotifications from "@/components/ClientNotifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maxx Traxx Admin Panel",
  description: "Manage drivers, loads, and maps in real time",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          {children}
          <Toaster 
          position="top-right"    // stack downward
          richColors
          closeButton
          expand={true}            //keep consistant width
          gap={8}             //spacing btw stacked toast
          duration={5000}     // auto close after 5s 
          visibleToasts={5}   // max toast visible at once
          
          />
          <ClientNotifications/>
        </AuthProvider>
      </body>
    </html>
  );
}

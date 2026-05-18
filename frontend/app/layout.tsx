import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "AI-Based Smart Waste Management and Classification System",
  description:
    "Intelligent waste classification system powered by AI. Automatically classify waste items and get eco-friendly disposal recommendations in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

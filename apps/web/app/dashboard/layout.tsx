"use client";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

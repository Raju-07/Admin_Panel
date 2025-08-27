"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {Header} from "@/components/dashboard/header";
import {Sidebar} from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      // Optional: check role in profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "admin") {
        router.replace("/login");
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

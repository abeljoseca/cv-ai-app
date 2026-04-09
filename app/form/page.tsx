"use client";

import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function FormPage() {
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from("test").select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    };

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">
        Conectando con Supabase... 🧠
      </h1>
    </main>
  );
}
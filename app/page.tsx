"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const getProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      if (error) {
        console.log("ERROR:", error);
      } else {
        setProfiles(data);
      }
    };

    getProfiles();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center flex-col gap-6">
      <h1 className="text-3xl font-bold">Usuarios en la base de datos</h1>

      {profiles.map((user) => (
        <div key={user.id} className="border p-4 rounded">
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      ))}
    </main>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/doctor/login");
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={handleLogout} className="rounded-full">
      Cerrar sesión
    </Button>
  );
}

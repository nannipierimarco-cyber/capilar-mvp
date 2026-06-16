import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin/auth";
import ContentPanel from "./ContentPanel";

export default async function ContentPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!verifyAdminToken(token ?? "")) {
    redirect("/admin/login");
  }

  return <ContentPanel />;
}

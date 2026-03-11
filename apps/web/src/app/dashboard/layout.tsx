import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const email = session.user.email ?? "";

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <DashboardSidebar email={email} />
      <main className="flex-1 overflow-y-auto md:ml-0">{children}</main>
    </div>
  );
}

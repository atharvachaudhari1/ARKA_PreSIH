import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { is_admin: true }
  });

  if (!dbUser || !dbUser.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Admin <span className="gradient-text">Panel</span>
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Platform monitoring and moderation.
        </p>
      </div>

      <nav style={{ 
        display: "flex", 
        gap: "1rem", 
        marginBottom: "2rem", 
        borderBottom: "1px solid var(--color-border)",
        paddingBottom: "1rem",
        overflowX: "auto"
      }}>
        <Link href="/admin" className="btn" style={{ padding: "0.5rem 1rem", background: "var(--color-bg-elevated)" }}>Dashboard</Link>
        <Link href="/admin/reports" className="btn" style={{ padding: "0.5rem 1rem", background: "var(--color-bg-elevated)" }}>Reports</Link>
        <Link href="/admin/events" className="btn" style={{ padding: "0.5rem 1rem", background: "var(--color-bg-elevated)" }}>Events</Link>
      </nav>

      <div>
        {children}
      </div>
    </div>
  );
}

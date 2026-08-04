import { prisma } from "@/lib/prisma";
import EventClient from "./EventClient";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      team_size_max: true,
      min_female_required: true,
      is_active: true,
    },
    orderBy: { created_at: "desc" }
  });

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Event Management</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Configure hackathon parameters and quota constraints.
        </p>
      </div>

      <EventClient initialEvents={events} />
    </div>
  );
}

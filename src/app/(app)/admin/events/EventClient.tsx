"use client";

import { useState } from "react";

type Event = {
  id: string;
  name: string;
  team_size_max: number;
  min_female_required: number;
  is_active: boolean;
};

export default function EventClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpdateEvent(event: Event) {
    const newMax = prompt(`Enter new max team size (current: ${event.team_size_max}):`, event.team_size_max.toString());
    if (!newMax) return;
    const newMin = prompt(`Enter new minimum female required (current: ${event.min_female_required}):`, event.min_female_required.toString());
    if (!newMin) return;

    setLoading(event.id);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_size_max: parseInt(newMax, 10),
          min_female_required: parseInt(newMin, 10),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEvents(events.map(e => e.id === event.id ? { ...e, ...updated } : e));
      } else {
        alert("Failed to update event");
      }
    } catch (e) {
      alert("Error updating event");
    }
    setLoading(null);
  }

  async function handleToggleActive(event: Event) {
    setLoading(event.id);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !event.is_active,
        }),
      });

      if (res.ok) {
        setEvents(events.map(e => e.id === event.id ? { ...e, is_active: !event.is_active } : e));
      } else {
        alert("Failed to toggle event");
      }
    } catch (e) {
      alert("Error toggling event");
    }
    setLoading(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {events.map(event => (
        <div key={event.id} className="card" style={{ padding: "1.5rem", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                {event.name} 
                <span style={{ 
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "1rem",
                  background: event.is_active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: event.is_active ? "#10b981" : "#ef4444"
                }}>
                  {event.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </h3>
              <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                <p>Max Team Size: {event.team_size_max}</p>
                <p>Min Female Required: {event.min_female_required}</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={() => handleUpdateEvent(event)} 
                disabled={loading === event.id}
                className="btn"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
              >
                Edit Config
              </button>
              <button 
                onClick={() => handleToggleActive(event)} 
                disabled={loading === event.id}
                className="btn"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
              >
                Toggle Status
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

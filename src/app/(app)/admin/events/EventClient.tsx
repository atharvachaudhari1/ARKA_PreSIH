"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

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
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    name: "",
    team_size_max: "6",
    min_female_required: "1",
    registration_deadline: "",
    themes: ""
  });

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
        toast("Event updated successfully", "success");
      } else {
        toast("Failed to update event", "error");
      }
    } catch (e) {
      toast("Error updating event", "error");
    }
    setLoading(null);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.team_size_max || !form.min_female_required) {
      toast("Please fill all required fields", "error");
      return;
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        themes: form.themes.split(",").map(t => t.trim()).filter(Boolean)
      })
    });

    if (res.ok) {
      const newEvent = await res.json();
      toast("Event created successfully", "success");
      setForm({ name: "", team_size_max: "6", min_female_required: "1", registration_deadline: "", themes: "" });
      setEvents([newEvent, ...events]);
    } else {
      toast("Failed to create event", "error");
    }
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
        toast(`Event marked as ${!event.is_active ? 'ACTIVE' : 'INACTIVE'}`, "success");
      } else {
        toast("Failed to toggle event", "error");
      }
    } catch (e) {
      toast("Error toggling event", "error");
    }
    setLoading(null);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="card" style={{ padding: "1.5rem", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", marginBottom: "2rem", background: "#ffffff" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "1rem", fontFamily: "var(--font-mono)", color: "#1a1a1a" }}>
          $ ./CREATE_NEW_EVENT
        </h3>
        
        <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>EVENT NAME *</label>
              <input 
                className="input-field" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="e.g. SIH 2026"
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", border: "2px solid #1a1a1a", background: "#f8f6f0", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>MAX SQUAD SIZE</label>
              <input 
                type="number"
                className="input-field" 
                value={form.team_size_max}
                onChange={e => setForm({...form, team_size_max: e.target.value})}
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", border: "2px solid #1a1a1a", background: "#f8f6f0", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>MIN FEMALE REQ</label>
              <input 
                type="number"
                className="input-field" 
                value={form.min_female_required}
                onChange={e => setForm({...form, min_female_required: e.target.value})}
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", border: "2px solid #1a1a1a", background: "#f8f6f0", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
          <button type="submit" style={{
            background: "#1a1a1a", color: "#fff", border: "2px solid #1a1a1a", boxShadow: "3px 3px 0px #5b5fc7",
            padding: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", cursor: "pointer", marginTop: "0.5rem", transition: "all 0.15s ease"
          }}>
            INITIALIZE EVENT
          </button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {events.length === 0 && (
          <div style={{ padding: "2rem", border: "2px dashed #1a1a1a", textAlign: "center", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#5a5a5a" }}>
            NO EVENTS CONFIGURED
          </div>
        )}
        {events.map(event => (
          <div key={event.id} className="card" style={{ padding: "1.5rem", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", background: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.3rem" }}>
                {event.name} 
              </h3>
              <div style={{ fontSize: "0.85rem", color: "#5a5a5a", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                TEAM MAX: {event.team_size_max} • FEMALE MIN: {event.min_female_required}
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={{ background: event.is_active ? "#d1fae5" : "#fee2e2", color: event.is_active ? "#065f46" : "#991b1b", padding: "5px 10px", border: "2px solid #1a1a1a", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginRight: "0.5rem" }}>
                {event.is_active ? "ACTIVE" : "INACTIVE"}
              </div>
              <button 
                onClick={() => handleUpdateEvent(event)} 
                disabled={loading === event.id}
                style={{ background: "#f8f6f0", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0px #1a1a1a", padding: "0.4rem 0.8rem", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: "0.8rem", cursor: "pointer" }}
              >
                EDIT
              </button>
              <button 
                onClick={() => handleToggleActive(event)} 
                disabled={loading === event.id}
                style={{ background: "#1a1a1a", color: "#fff", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0px #1a1a1a", padding: "0.4rem 0.8rem", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: "0.8rem", cursor: "pointer" }}
              >
                TOGGLE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

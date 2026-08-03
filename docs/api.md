# TeamUp — API Reference

> All routes require authentication (NFR6). Include the Supabase session cookie on all requests.
> All responses are JSON unless otherwise noted.
> `id_card_storage_path` is **never** returned by any endpoint (GAP-RESOLVED-6).

---

## Auth

### POST /api/auth/signout
Sign out the current user and clear the session cookie.

**Auth**: Required  
**Response**: 302 redirect to `/login`

---

## Users

### POST /api/users/profile
Create a user profile (called immediately after signup).

**Auth**: Required  
**Body**:
```json
{
  "name": "string (required)",
  "gender": "male | female (required)",
  "college": "string (required)",
  "department": "string (required)",
  "past_hackathons_count": "number",
  "bio": "string (optional)",
  "id_card_storage_path": "string (required)",
  "intent": "join | create (optional)"
}
```
**Response 201**:
```json
{
  "profile": {
    "id": "...",
    "name": "...",
    "email": "...",
    "gender": "male | female",
    "college": "...",
    "department": "...",
    "verification_status": "pending",
    "past_hackathons_count": 0,
    "bio": null,
    "created_at": "..."
  }
}
```
**Errors**: 400 (validation), 401 (unauthenticated), 409 (profile exists)

---

### GET /api/users/profile
Get the authenticated user's own profile.

**Auth**: Required  
**Response 200**:
```json
{
  "profile": {
    "id": "...",
    "name": "...",
    "email": "...",
    "gender": "...",
    "college": "...",
    "department": "...",
    "verification_status": "pending | verified | rejected",
    "past_hackathons_count": 0,
    "bio": null,
    "presentation_skill_rating": null,
    "phone_number": null,
    "whatsapp_number": null,
    "linkedin_url": null,
    "contact_visibility": "private",
    "skills": [{ "skill": "React", "proficiency": "advanced" }],
    "created_at": "...",
    "updated_at": "..."
  }
}
```
**Errors**: 401, 404

---

## Teams (Phase 2 — not yet implemented)

### GET /api/teams
Browse/filter teams (with field-level access control per Section 4 of build guide).
- Query params: `status`, `skill`, `gender_needed`, `domain`, `vacancy_min`

### POST /api/teams
Create a new team. Creator is automatically assigned `role=leader` (FR12/GAP-RESOLVED-1).

### GET /api/teams/:id
Get a single team card with public field set.

---

## Join Requests (Phase 3 — not yet implemented)

### POST /api/join-requests
Send a join request (`user_to_team`) or team invite (`team_to_user`).
- DB partial unique index prevents duplicate pending requests (GAP-RESOLVED-5).
- On accept: triggers cascade-expiry of all other pending requests (both directions) for that user (GAP-RESOLVED-4).

### PATCH /api/join-requests/:id/opinion
Submit a consultative opinion (team member only). Advisory, never auto-decides outcome.

### PATCH /api/join-requests/:id/decision
Leader accept/reject. Only the team's current leader may call this.
- On accept: triggers cascade-expiry + notifications.
- Requester's live profile (not a snapshot) is what the team saw (GAP-RESOLVED-3).

### POST /api/join-requests/:id/transfer-leadership
Transfer team leadership to another existing member (FR12, available Phase 3+).

---

## Notifications (Phase 4 — not yet implemented)

### GET /api/notifications
Get the authenticated user's notifications. Types:
- `new_join_request`
- `teammate_opinion_added`
- `leader_decision_made`
- `request_accepted`
- `request_rejected`
- `request_expired_other_team_joined`
- `team_now_full`

### PATCH /api/notifications/:id/read
Mark a notification as read.

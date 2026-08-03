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

### PATCH /api/users/profile
Update the authenticated user's own profile. Allows partial updates. 
*Note: `id_card_storage_path` and `verification_status` are strictly protected and cannot be updated via this endpoint.*

**Auth**: Required  
**Body**:
```json
{
  "name": "string",
  "gender": "male | female",
  "college": "string",
  "department": "string",
  "bio": "string",
  "past_hackathons_count": 0,
  "presentation_skill_rating": 3,
  "phone_number": "string",
  "whatsapp_number": "string",
  "linkedin_url": "string",
  "contact_visibility": "private | team_only | public_to_logged_in"
}
```
**Response 200**:
```json
{
  "profile": { ...updated_profile_fields... }
}
```
**Errors**: 400 (validation), 401 (unauthorized)

---

### POST /api/users/skills
Add or update a skill for the authenticated user.

**Auth**: Required  
**Body**:
```json
{
  "skill": "React",
  "proficiency": "beginner | intermediate | advanced | expert"
}
```
**Response 201**:
```json
{
  "skill": {
    "skill": "React",
    "proficiency": "advanced"
  }
}
```
**Errors**: 400 (validation), 401 (unauthorized)

---

### DELETE /api/users/skills
Remove a skill from the authenticated user's profile.

**Auth**: Required  
**Body**:
```json
{
  "skill": "React"
}
```
**Response 200**:
```json
{
  "message": "Skill removed"
}
```
**Errors**: 400 (missing skill), 401 (unauthorized)

---

## Teams (Phase 2)

### GET /api/teams
Fetches a list of open or full teams. Supports filtering.
**Semi-transparency rule**: The leader's public contact info is exposed, but other members' contact info is strictly excluded.

**Auth**: Required
**Query Params**:
- `status`: `open` | `full`
- `domain`: `string`
- `gender_need`: `true`
- `min_experience`: `integer`
- `skills_needed[]`: array of strings

**Response 200**:
```json
{
  "teams": [
    {
      "id": "cuid",
      "name": "TeamUp Builders",
      "status": "open",
      "needed_female_count": 1,
      "domain_interest": "Web3",
      "skills_needed": ["React", "Node"],
      "leader": {
        "id": "cuid",
        "name": "Alice",
        "phone_number": "...",
        "linkedin_url": "..."
      },
      "memberships": [
        {
          "user": {
            "name": "Bob",
            "department": "CSE",
            "verification_status": "verified",
            "skills": []
          }
        }
      ]
    }
  ]
}
```

---

### POST /api/teams
Creates a new team, automatically assigning the caller as the `leader` and updating their contact visibility to public.

**Auth**: Required  
**Body**:
```json
{
  "name": "string",
  "description": "string?",
  "domain_interest": "string?",
  "skills_needed": ["string"],
  "min_experience_required": "string?",
  "succession_mode": "manual | auto_promote"
}
```
**Response 201**:
```json
{
  "team": {
    "id": "cuid",
    "name": "...",
    "status": "open",
    "needed_female_count": 1
  }
}
```
**Errors**: 400 (validation), 401 (unauthorized)

---

### GET /api/teams/[id]
Fetches details for a specific team.
Same transparency rules apply as the list endpoint.

---

## Join Requests (Phase 3)

### GET /api/join-requests
Fetches the authenticated user's requests (`myRequests`) and requests sent to their team (`teamRequests`).

### POST /api/join-requests
Send a join request (`user_to_team`) or team invite (`team_to_user`).
- DB partial unique index prevents duplicate pending requests.

**Auth**: Required  
**Body**:
```json
{
  "team_id": "string (required for user_to_team)",
  "user_id": "string (required for team_to_user)",
  "direction": "user_to_team | team_to_user (default: user_to_team)"
}
```

### PATCH /api/join-requests/:id/opinion
Submit a consultative opinion (team member only).
**Body**:
```json
{
  "opinion": "approve | reject | neutral"
}
```

### PATCH /api/join-requests/:id/decision
Leader accept/reject. Only the team's current leader may call this.
- On accept: triggers cascade-expiry of all other requests for the user, and transitions team to "full" if capacity reached (cascade-expiring team requests).

**Body**:
```json
{
  "decision": "accept | reject"
}
```



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

/**
 * Terminal/outcome notification types.
 *
 * These notifications report the final result of a join-request process
 * (accepted, rejected, team filled up). They are one-time status updates:
 * once the user has read them there is nothing left to act on, so they are
 * removed from the feed instead of being kept in the "read" section.
 *
 * NOTE: `request_expired_other_team_joined` is intentionally NOT in this list.
 * It is a terminal outcome, but the user may want to look back later to see why
 * their request expired / which team filled the slot — so it stays in the
 * persistent "read" section.
 *
 * Actionable notifications (new_join_request, teammate_opinion_added,
 * leader_decision_made) stay in the read section because the user may need to
 * revisit the decision context.
 */
export const OUTCOME_NOTIFICATION_TYPES = [
  "request_accepted",
  "request_rejected",
  "team_now_full",
] as const;

export type OutcomeNotificationType = (typeof OUTCOME_NOTIFICATION_TYPES)[number];

export function isOutcomeNotificationType(type: string): boolean {
  return (OUTCOME_NOTIFICATION_TYPES as readonly string[]).includes(type);
}

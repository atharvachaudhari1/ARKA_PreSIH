-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON "notifications";
DROP POLICY IF EXISTS "Users can read their team chats" ON "chat_messages";

-- Create SECURITY DEFINER functions for Realtime WAL parsing
CREATE OR REPLACE FUNCTION is_user_notification(notif_user_id TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = notif_user_id 
    AND auth_user_id = (auth.uid())::text
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_team_member(check_team_id TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_memberships tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = check_team_id 
    AND u.auth_user_id = (auth.uid())::text
  );
END;
$$;

-- Re-create policies using the SECURITY DEFINER functions
CREATE POLICY "Users can read their own notifications" ON "notifications"
  FOR SELECT
  USING (is_user_notification(user_id));

CREATE POLICY "Users can read their team chats" ON "chat_messages"
  FOR SELECT
  USING (is_team_member(team_id));

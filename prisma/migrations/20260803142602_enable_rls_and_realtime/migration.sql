-- Enable RLS for notifications
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" ON "notifications"
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM "users" WHERE auth_user_id = (auth.uid())::text
    )
  );

-- Enable RLS for chat_messages
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their team chats" ON "chat_messages"
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM "team_memberships" 
      WHERE user_id IN (
        SELECT id FROM "users" WHERE auth_user_id = (auth.uid())::text
      )
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "notifications";
ALTER PUBLICATION supabase_realtime ADD TABLE "chat_messages";
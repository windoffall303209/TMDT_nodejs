ALTER TABLE chat_conversations
ADD COLUMN conversation_state LONGTEXT NULL AFTER handling_mode;

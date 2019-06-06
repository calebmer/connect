-- The kind of a message in our inbox.
--
-- Currently there is only one kind, but in the future we will add more. For
-- example, new posts in a topic the user is subscribed to.
CREATE TYPE inbox_message_kind AS ENUM (
  -- A comment was added to the inbox! Either it’s a new comment on a post our
  -- account is following or it’s a comment that mentioned an account.
  'comment'
);

-- The inbox table represents all the incoming messages an account might receive
-- for activity in their Connect groups.
CREATE TABLE inbox (
  id CHAR(22) NOT NULL PRIMARY KEY,
  -- The account receiving the message.
  recipient_id CHAR(22) NOT NULL REFERENCES account(id),
  -- The time at which the message was sent to the recipient’s inbox.
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Was this message dismissed? If so then it should no longer appear in the
  -- account’s inbox.
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  -- What kind of message was this?
  kind inbox_message_kind NOT NULL,
  -- If the message references a comment we store the ID here.
  comment_id CHAR(22) REFERENCES comment(id),

  -- Makes sure that “comment” inbox messages have all the required columns.
  CONSTRAINT kind_comment CHECK (kind <> 'comment' OR comment_id IS NOT NULL)
);

-- Very important index for fetching active inbox messages in reverse
-- chronological order. Index by:
--
-- * `recipient_id` since each account needs to see its own inbox messages.
-- * `dismissed` because we usually only want to fetch the active messages.
-- * `sent_at` so that we can sort the messages in reverse chronological order.
-- * `id` to have a cursor between two items with the same timestamp.
CREATE INDEX inbox_sent_at ON inbox (recipient_id, dismissed DESC, sent_at DESC, id DESC);

-- Allow our API to access this table, but only after passing row level
-- security policies.
ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE inbox TO connect_api;

-- You may only select inbox messages that are yours!
CREATE POLICY select_inbox ON inbox FOR SELECT USING
  (recipient_id = current_account_id());

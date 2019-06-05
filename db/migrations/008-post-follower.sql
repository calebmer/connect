-- Represents an account following some post. Whenever a comment is added to the
-- post the account will be notified.
CREATE TABLE post_follower (
  -- The post our account is following.
  post_id CHAR(22) NOT NULL REFERENCES post(id),
  -- The account following the post.
  account_id CHAR(22) NOT NULL REFERENCES account(id),
  -- The time at which the account started following the post. This column will
  -- probably never be shared with the user, but it is nice for
  -- bookeeping purposes.
  followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- We have a compound primary key between the post and the account following
  -- the post. Note that the post comes first since we will pretty frequently
  -- be selecting all the followers of a post when sending push notifications.
  PRIMARY KEY (post_id, account_id)
);

-- Allow our API to access this table, but only after passing row level
-- security policies.
ALTER TABLE post_follower ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE post_follower TO connect_api;
GRANT INSERT ON TABLE post_follower TO connect_api;

-- Account must be the one following to see it.
CREATE POLICY select_post_follower ON post_follower FOR SELECT USING
  (account_id = current_account_id());

-- We can only insert a follow a post for ourselves.
CREATE POLICY insert_post_follower ON post_follower FOR INSERT WITH CHECK
  (account_id = current_account_id());

-----------------------------
--| Migrate existing data |--
-----------------------------

-- For all posts have the author of that post follow the post.
INSERT INTO post_follower (post_id, account_id)
  SELECT id, author_id FROM post
  ON CONFLICT DO NOTHING;

-- For all comments have the author of that comment follow the post the comment
-- was left on.
INSERT INTO post_follower (post_id, account_id)
  SELECT post_id, author_id FROM comment
  ON CONFLICT DO NOTHING;

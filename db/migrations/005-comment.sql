-- A comment left by a person on a post. There are no threads inside of
-- comments, at the moment. Only posts and their comments.
CREATE TABLE comment (
  -- The unique identifier of this comment.
  id CHAR(22) PRIMARY KEY,
  -- The post this comment was left on.
  post_id CHAR(22) NOT NULL REFERENCES post(id),
  -- The author of this comment.
  author_id INT NOT NULL REFERENCES account(id),
  -- The time this comment was published. Could be different from the last time
  -- this comment was updated.
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- The contents of this comment with markdown formatting.
  content TEXT NOT NULL
);

-- Very important index for fetching comments in chronological order. Index by:
--
-- * `post_id` so that we can easily find all the comments for a
--   particular post.
-- * `published_at` so that we can fetch the comments for a post in
--   chronological order.
-- * `id` to disambiguate two comments which were posted at the exact same time.
CREATE INDEX comment_published_at ON comment (post_id, published_at, id);

-- Allow our API to access this table, but only after passing row level
-- security policies.
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE comment TO connect_api;
GRANT INSERT ON TABLE comment TO connect_api;

-- We must be able to select the post this comment was left on to be able to
-- select the comment. Policies are executed using the same permissions as the
-- query they were added to. That means by selecting a post we will also be
-- running the post `SELECT` policy.
CREATE POLICY select_comment ON comment FOR SELECT USING
  (EXISTS (SELECT 1 FROM post WHERE id = post_id));

-- An account may only publish a comment as themselves in a group they are a
-- member of.
CREATE POLICY insert_comment ON comment FOR INSERT WITH CHECK
  (comment.author_id = current_account_id() AND
   EXISTS (SELECT 1
             FROM group_member
            WHERE group_member.account_id = current_account_id() AND
                  group_member.group_id = (SELECT post.group_id
                                             FROM post
                                            WHERE post.id = comment.post_id)));

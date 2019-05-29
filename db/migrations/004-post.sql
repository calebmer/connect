-- A post in a group. Every post _must_ be posted in a group. However, a post
-- can have any number of topics in that group.
CREATE TABLE post (
  -- The unique identifier for this post.
  id CHAR(22) PRIMARY KEY,
  -- The group this was posted in.
  group_id CHAR(22) NOT NULL REFERENCES "group"(id),
  -- The author of this post.
  author_id CHAR(22) NOT NULL REFERENCES account(id),
  -- The time the post was published. In the future we might also have a
  -- `created_at` time which represents when the post was created for
  -- draft posts.
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- The contents of this post in markdown formatting.
  content TEXT NOT NULL
);

-- Very important index for fetching posts in reverse chronological order.
-- Index by:
--
-- * `group_id` so that we can easily find all the posts for a
--   particular group.
-- * `published_at` so that we can fetch the posts for a group in
--   reverse chronological order. We make sure the order is descending because
--   we want to select posts in _reverse_ chronological order.
-- * `id` to disambiguate two posts which were posted at the exact same time.
CREATE INDEX post_published_at ON post (group_id, published_at DESC, id DESC);

-- Allow our API to access this table, but only after passing row level
-- security policies.
ALTER TABLE post ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE post TO connect_api;
GRANT INSERT ON TABLE post TO connect_api;

-- Account must be a member of the group the post was published in to see
-- the post.
CREATE POLICY select_post ON post FOR SELECT USING
  (EXISTS (SELECT 1
             FROM group_member
            WHERE group_member.account_id = current_account_id() AND
                  group_member.group_id = post.group_id));

-- Account may only insert a post that they authored in a group that they are
-- a member of.
CREATE POLICY insert_post ON post FOR INSERT WITH CHECK
  (post.author_id = current_account_id() AND
   EXISTS (SELECT 1
             FROM group_member
            WHERE group_member.account_id = current_account_id() AND
                  group_member.group_id = post.group_id));

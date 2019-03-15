-- A post in a group. Every post _must_ be posted in a group. However, a post
-- can have any number of topics in that group.
CREATE TABLE post (
  -- The unique identifier for this post.
  id SERIAL PRIMARY KEY,
  -- The group this was posted in.
  group_id INT NOT NULL REFERENCES "group"(id),
  -- The author of this post.
  author_id INT NOT NULL REFERENCES account(id),
  -- The contents of this post in markdown formatting.
  content TEXT NOT NULL,
  -- The time the post was published. In the future we might also have a
  -- `created_at` time which represents when the post was created for
  -- draft posts.
  published_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Very important index for fetching posts in chronological order. Index by:
--
-- * `group_id` so that we can easily find all the posts for a
--   particular group.
-- * `published_at` so that we can fetch the posts for a group in
--   chronological order.
-- * `id` to disambiguate two posts which were posted at the exact same time.
CREATE INDEX post_published_at ON post (group_id, published_at, id);

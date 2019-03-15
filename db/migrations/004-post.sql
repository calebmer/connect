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

-- Very important index for fetching all the posts from a group in reverse
-- chronological order.
CREATE INDEX post_group_created_at ON post (group_id, published_at);

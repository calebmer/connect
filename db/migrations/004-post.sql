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
  -- The time the post was created. Could be different from the time the post
  -- was actually published or updated.
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

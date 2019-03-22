-- A comment left by a person on a post. There are no threads inside of
-- comments, at the moment. Only posts and their comments.
CREATE TABLE comment (
  -- The unique identifier of this comment.
  id SERIAL PRIMARY KEY,
  -- The post this comment was left on.
  post_id INT NOT NULL REFERENCES post(id),
  -- The author of this comment.
  author_id INT NOT NULL REFERENCES account(id),
  -- The contents of this comment with markdown formatting.
  content TEXT NOT NULL,
  -- The time this comment was posted. Could be different from the last time
  -- this comment was updated.
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Very important index for fetching comments in chronological order. Index by:
--
-- * `post_id` so that we can easily find all the comments for a
--   particular post.
-- * `posted_at` so that we can fetch the comments for a post in
--   chronological order.
-- * `id` to disambiguate two comments which were posted at the exact same time.
CREATE INDEX comment_posted_at ON comment (post_id, posted_at, id);

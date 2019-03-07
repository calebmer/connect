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
  -- The time this comment was created. Could be different from the last time
  -- this comment was updated.
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

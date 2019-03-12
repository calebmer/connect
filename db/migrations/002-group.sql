-- A group is some _private_ collection of people who all share something in
-- common which has caused their group to form. Whether they work together or
-- they play together.
--
-- Other names considered for this object include “community”, “team”, and
-- “workspace”. All of these felt like the leaned a little too much into either
-- the “work” or “play” aspect. We want a more neutral name so chose “group”.
--
-- NOTE: In SQL “group” is a keyword. So whenever we reference the group table
-- we need to surround it in double quotes. Double quotes escape a SQL
-- identifier. Single quotes represent a SQL string literal.
CREATE TABLE "group" (
  -- The identifier for a group. We don’t use the slug as the identifier since
  -- the slug may change over time.
  id SERIAL PRIMARY KEY,
  -- The slug of a group represents the way we reference this group in a URL.
  -- It is not the primary key of our table since it may change over time.
  --
  -- A slug can only be made up of alphanumeric characters and hyphens or
  -- underscores. Twitter handle rules, basically.
  slug TEXT NOT NULL UNIQUE,
  -- The display name for this group in plain text. No limitations on the
  -- display name unlike the group’s slug.
  name TEXT NOT NULL,
  -- The account which currently owns the group. Usually the account which
  -- created the group although ownership may be transferred.
  owner_id INT NOT NULL REFERENCES account(id),
  -- The time the group was created at for bookkeeping.
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

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

-- An account’s membership in a group. Accounts can’t join arbitrary groups.
-- They must be invited to a group.
CREATE TABLE group_member (
  -- The account which is a member of this group.
  account_id INT NOT NULL REFERENCES account(id),
  -- The group which this account is a part of.
  group_id INT NOT NULL REFERENCES "group"(id),
  -- The date at which the account joined the group.
  joined_at TIMESTAMP NOT NULL DEFAULT now(),
  -- We have a compound primary key on this table between the account and
  -- group IDs.
  PRIMARY KEY (account_id, group_id)
);





GRANT SELECT ON TABLE "group" TO connect_user;
ALTER TABLE "group" ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_member_of ON "group" FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM group_member
    WHERE
      group_member.account_id = current_account_id() AND
      group_member.group_id = "group".id
  )
);





GRANT SELECT ON TABLE group_member TO connect_user;
ALTER TABLE group_member ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own ON group_member FOR SELECT USING
  (account_id = current_account_id());

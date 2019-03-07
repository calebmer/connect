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

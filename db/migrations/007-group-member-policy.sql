-- Checks to see if the current account is a member of the provided group.
--
-- We use this to break infinite recursion in the `group_member` selection
-- policy. We want a `group_member` selection policy where the user can see all
-- the other accounts in their group. However, that means selecting from the
-- `group_member` table in the `group_member` policy. See the problem?
--
-- This function is marked as `SECURITY DEFINER` which means it won‘t add any
-- row level security policies.
CREATE FUNCTION is_current_account_group_member(group_id CHAR(22)) RETURNS BOOL AS $$
  SELECT EXISTS (SELECT 1
                   FROM group_member
                  WHERE account_id = current_account_id() AND
                        group_id = $1)
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Use the function we defined so that we don’t recursively add
-- the `group_member` policy.
ALTER POLICY select_group ON "group" USING (is_current_account_group_member(id));

-- Use the function we defined so that we don’t recursively add
-- the `group_member` policy.
ALTER POLICY select_group_member ON group_member USING
  (account_id = current_account_id() OR is_current_account_group_member(group_id));

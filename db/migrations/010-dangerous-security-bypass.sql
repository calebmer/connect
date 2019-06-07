-- Rename the `connect_api_auth` role to `connect_api_dangerous_security_bypass`
-- since we want to give this role a more general purpose role in bypassing row
-- level security policies.
--
-- Giving it a long and ugly name should also discourage usage of the role!
ALTER ROLE connect_api_auth RENAME TO connect_api_dangerous_security_bypass;

-- Also allow our dangeroous security bypassing role to bypass *all* RLS
-- policies. That’s what makes this role so dangerous.
ALTER ROLE connect_api_dangerous_security_bypass WITH BYPASSRLS;

-- Allow viewing all of a posts followers when dangerously bypassing security.
-- We keep who is following a post private.
GRANT SELECT ON TABLE post_follower TO connect_api_dangerous_security_bypass;

-- Allow adding inbox messages for _any user_ when dangerously
-- bypassing security.
GRANT INSERT ON TABLE inbox TO connect_api_dangerous_security_bypass;

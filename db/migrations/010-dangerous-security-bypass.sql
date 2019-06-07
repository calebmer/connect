-- Rename the `connect_api_auth` role to `connect_api_dangerous_security_bypass`
-- since we want to give this role a more general purpose role in bypassing row
-- level security policies.
--
-- Giving it a long and ugly name should also discourage usage of the role!
ALTER ROLE connect_api_auth RENAME TO connect_api_dangerous_security_bypass;

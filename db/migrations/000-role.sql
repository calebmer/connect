-- Create the role we will use for ensuring proper access to our APIs.
--
-- IMPORTANT: This role does not inherit from other roles it is a member of!
-- For example, `connect_api` is a member of `connect_api_auth` but it does not
-- inherit the permissions of `connect_api_auth` which is allowed to view
-- sensitive data like password hashes. It must be an explicit choice for
-- `connect_api` to opt-into a different set of permissions. That way we don’t
-- accidentally give our API access to private data in _every_ API method. Only
-- the methods which opt-into another role.
CREATE ROLE connect_api LOGIN PASSWORD 'connect_api' NOINHERIT;

-- Our API will use this role when authenticating users. This role has very
-- limited, but highly privaleged, access to the database. It can see
-- information like account emails, account password hashes, and refresh tokens.
--
-- We only use this role in auth functions to help avoid accidentally leaking
-- private information.
--
-- MIGRATION NOTE: We rename this role to `connect_api_dangerous_security_bypass`
-- in a later migration! This is because we gave it a more general pupose role
-- in bypassing security. We also want to discourage usage of the role.
CREATE ROLE connect_api_auth ROLE connect_api;

-- Allow our new roles to see the objects in the Connect schema.
GRANT USAGE ON SCHEMA connect TO connect_api, connect_api_auth;

-- A convenience function that will return the current account ID.
CREATE FUNCTION current_account_id() RETURNS CHAR(22) AS $$
  SELECT current_setting('connect.account_id', false)::CHAR(22);
$$ LANGUAGE SQL STABLE;

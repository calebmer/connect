-- Create the role we will use for ensuring proper access to our APIs.
--
-- IMPORTANT: This role does not inherit from other roles it is a member of!
-- For example, `connect_api` is a member of `connect_api_auth` but it does not
-- inherit the permissions of `connect_api_auth` which is allowed to view
-- sensitive data like password hashes. It must be an explicit choice for
-- `connect_api` to opt-into a different set of permissions. That way we don’t
-- accidentally give our API access to private data in _every_ API method. Only
-- the methods which opt-into another role.
CREATE ROLE connect_api LOGIN NOINHERIT;

-- Our API will use this role when authenticating users. This role has very
-- limited, but highly privaleged, access to the database. It can see
-- information like account emails, account password hashes, and refresh tokens.
--
-- We only use this role in auth functions to help avoid accidentally leaking
-- private information.
CREATE ROLE connect_api_auth ROLE connect_api;

-- Allow our new roles to see the objects in the Connect schema.
GRANT USAGE ON SCHEMA connect TO connect_api, connect_api_auth;

-- A convenience function that will return the current account ID.
CREATE FUNCTION current_account_id() RETURNS INT AS $$
  SELECT current_setting('connect.account_id', false)::INT;
$$ LANGUAGE SQL STABLE;

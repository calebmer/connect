-- Create the role we will use for ensuring proper access to our APIs.
CREATE ROLE connect_api LOGIN;

-- Allow our API user to see the objects in the Connect schema.
GRANT USAGE ON SCHEMA connect TO connect_api;

-- Creates a function that will return the current account ID set as a
-- configuration parameter.
CREATE FUNCTION current_account_id() RETURNS INT AS $$
  SELECT current_setting('connect.account_id', false)::INT;
$$ LANGUAGE SQL STABLE;

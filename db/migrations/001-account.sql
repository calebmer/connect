-- We try to avoid using the word “user” since it’s not very personal. We serve
-- people, not users.
--
-- Accounts don’t map 1:1 with people. One person could have multiple accounts
-- or a business could also have an account. So we call our main authentication
-- table the account table.
CREATE TABLE account (
  -- Automatically generate a new ID for every account. In the future, we might
  -- not require an email to create an account. So an email would be a bad
  -- primary key.
  id SERIAL PRIMARY KEY,
  -- The display name for this account. This is how people will be able to
  -- reference each other. There will, of course, be duplicates.
  --
  -- We recommend that people use their first name. This balances anonymity with
  -- real, authentic, names.
  name TEXT NOT NULL,
  -- A URL to some avatar image associated with this account. Could be of any
  -- size or format.
  avatar_url TEXT,
  -- The email associated with this account. Must be unique since the email is
  -- used to sign in to the account and reset the account’s password. Of course,
  -- one could always create a new email address if they want a new account.
  email TEXT NOT NULL UNIQUE,
  -- A bcrypt hash of the account password.
  password_hash TEXT NOT NULL,
  -- The time at which the account was created.
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create a view of the `account` table with just the account’s public profile
-- information. Not including the account’s private data like `email`
-- and `password_hash`.
CREATE VIEW account_profile AS
  SELECT id, name, avatar_url
    FROM account;

-- Allow `connect_api_auth` to access the private data in our `account` table
-- like `email` and `password_hash`.
GRANT SELECT ON TABLE account TO connect_api_auth;
GRANT INSERT ON TABLE account TO connect_api_auth;
GRANT USAGE ON SEQUENCE account_id_seq TO connect_api_auth;

-- Allow all users to select from `account_profile`. All account profile
-- information is public.
GRANT SELECT ON TABLE account_profile TO connect_api;

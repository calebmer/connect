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
  -- The email associated with this account. Must be unique since the email is
  -- used to sign in to the account and reset the account’s password. Of course,
  -- one could always create a new email address if they want a new account.
  email TEXT UNIQUE,
  -- A bcrypt hash of the account password.
  password_hash TEXT NOT NULL
);

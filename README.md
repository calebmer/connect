# Connect

> **Note:** Connect is the codename for this project. We need a proper name! Ideas welcome.

## Setup

1. Clone this repo.
2. Run `yarn` to install node modules.
3. Install Postgres. (recommended for MacOS users https://postgresapp.com)
4. Make sure Postgres is running.
5. Run `yarn workspace @connect/db reset` to setup the database schema.

To run the API: `yarn workspace @connect/api-server dev`

To run the web site: `yarn workspace @connect/app dev:web`

To run the React Native packager: `yarn workspace @connect/app dev:native`

For all the `yarn workspace` commands, you can also `cd` into the appropriate directory and run the command directly. For example, instead of `yarn workspace @connect/api-server dev` you could run `cd api/server && yarn dev`.

Look for all the `package.json` files to see all the available workspaces.

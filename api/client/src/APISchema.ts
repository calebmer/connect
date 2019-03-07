import {Schema} from "./Schema";
import {SchemaInput} from "./SchemaInput";
import {SchemaOutput} from "./SchemaOutput";

/**
 * The declaration of the operations available in our API. We will use this
 * schema to generate an API client and an API server. Well, the API server
 * will need the actual definitions for these methods, but hopefully you get
 * the idea.
 */
export const APISchema = Schema.namespace({
  account: Schema.namespace({
    /**
     * Registers a new account which can be used to access our service.
     * Currently we require an email for password recovery. The account may be
     * accessed again at any time and any device with the email/password
     * combination used at registration.
     *
     * Also signs the person into their newly created account.
     */
    signUp: Schema.unauthorizedMethod({
      input: {
        displayName: SchemaInput.string,
        email: SchemaInput.string,
        password: SchemaInput.string,
      },
      output: SchemaOutput.t<{
        readonly accessToken: string;
        readonly refreshToken: string;
      }>(),
    }),

    /**
     * Signs a person into their existing account with the email/password
     * combination they used when they signed up.
     *
     * Authorization uses two tokens. An access token and refresh token. The
     * access token is a stateless JWT token which expires after a relatively
     * short time period. During that time period we don’t need to lookup the
     * access token in the database. When the access token expires we can use
     * the refresh token to get a new access token.
     *
     * See the [Auth0 blog][1] for more information about refresh tokens.
     *
     * [1]: https://auth0.com/learn/refresh-tokens
     */
    signIn: Schema.unauthorizedMethod({
      input: {
        email: SchemaInput.string,
        password: SchemaInput.string,
      },
      output: SchemaOutput.t<{
        readonly accessToken: string;
        readonly refreshToken: string;
      }>(),
    }),

    /**
     * Signs a person out of their account on the current device.
     *
     * We sign out a person by invalidating their refresh token. We can’t
     * invalidate their access token, so we trust that the client forgets the
     * access token. The access token will eventually expire.
     */
    signOut: Schema.unauthorizedMethod({
      input: {
        refreshToken: SchemaInput.string,
      },
      output: SchemaOutput.t<{}>(),
    }),

    /**
     * Uses a refresh token to generate a new access token. This method can be
     * used when you have an expired access token and you need to get a new one.
     */
    refreshAccessToken: Schema.unauthorizedMethod({
      input: {
        refreshToken: SchemaInput.string,
      },
      output: SchemaOutput.t<{
        readonly accessToken: string;
      }>(),
    }),

    /**
     * Gets basic information about the current account’s profile. Takes no
     * input because we use the authorization context to determine the
     * current profile.
     */
    getCurrentAccount: Schema.method({
      input: {},
      output: SchemaOutput.t<Account>(),
    }),
  }),

  /**
   * Gets a group by its identifier.
   */
  getGroup: Schema.method({
    input: {id: SchemaInput.number},
    output: SchemaOutput.t<{readonly group: Group | undefined}>(),
  }),

  /**
   * Gets a group by its slug.
   */
  getGroupBySlug: Schema.method({
    input: {slug: SchemaInput.string},
    output: SchemaOutput.t<{readonly group: Group | undefined}>(),
  }),
});

export type Account = {
  readonly id: number;
  readonly displayName: string;
  readonly avatarURL: string;
};

export type Group = {
  readonly id: number;
  readonly slug: string;
  readonly displayName: string;
  readonly ownerID: number;
  readonly createdAt: string;
};

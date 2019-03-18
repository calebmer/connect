import {AccessToken, RefreshToken} from "./entities/Tokens";
import {Comment, CommentCursor} from "./entities/Comment";
import {Group, GroupID} from "./entities/Group";
import {Post, PostCursor, PostID} from "./entities/Post";
import {AccountProfile} from "./entities/Account";
import {RangeInputFields} from "./Range";
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
      safe: false,
      input: {
        name: SchemaInput.string(),
        email: SchemaInput.string(),
        password: SchemaInput.string(),
      },
      output: SchemaOutput.t<{
        readonly accessToken: AccessToken;
        readonly refreshToken: RefreshToken;
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
      safe: false,
      input: {
        email: SchemaInput.string(),
        password: SchemaInput.string(),
      },
      output: SchemaOutput.t<{
        readonly accessToken: AccessToken;
        readonly refreshToken: RefreshToken;
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
      safe: false,
      input: {
        refreshToken: SchemaInput.string<RefreshToken>(),
      },
      output: SchemaOutput.t<{}>(),
    }),

    /**
     * Uses a refresh token to generate a new access token. This method can be
     * used when you have an expired access token and you need to get a new one.
     */
    refreshAccessToken: Schema.unauthorizedMethod({
      safe: false,
      input: {
        refreshToken: SchemaInput.string<RefreshToken>(),
      },
      output: SchemaOutput.t<{
        readonly accessToken: AccessToken;
      }>(),
    }),

    /**
     * Gets basic information about the current account’s profile. Takes no
     * input because we use the authorization context to determine the
     * current profile.
     */
    getCurrentProfile: Schema.method({
      safe: true,
      input: {},
      output: SchemaOutput.t<{
        readonly account: AccountProfile;
      }>(),
    }),
  }),

  group: Schema.namespace({
    /**
     * Fetches a group by its slug which was likely taken from a URL. If a group
     * does not exist or our account is not a member of that group we throw
     * a “not found” error.
     */
    getBySlug: Schema.method({
      safe: true,
      input: {
        slug: SchemaInput.string(),
      },
      output: SchemaOutput.t<{
        readonly group: Group;
      }>(),
    }),

    /**
     * Gets a list of the posts in a group in reverse chronological order.
     * If the person is not a member of the group or the group does not exist,
     * we will throw a “not found” error.
     *
     * Uses cursor based pagination to only select a subset of posts. We always
     * require a limit to avoid selecting the entire table.
     */
    getPosts: Schema.method({
      safe: true,
      input: {
        id: SchemaInput.integer<GroupID>(),
        ...RangeInputFields<PostCursor>(),
      },
      output: SchemaOutput.t<{
        readonly posts: ReadonlyArray<Post>;
      }>(),
    }),
  }),

  post: Schema.namespace({
    /**
     * All of the comment replies to a post. Sorted by the time they were posted
     * with the first comments at the beginning of the list.
     *
     * **TODO:** It should also be easy to read the latest comments. Not just
     * the earliest comments. For example, if someone is participating in a
     * discussion then they’ll want to see the most up-to-date comments.
     */
    getComments: Schema.method({
      safe: true,
      input: {
        id: SchemaInput.integer<PostID>(),
        ...RangeInputFields<CommentCursor>(),
      },
      output: SchemaOutput.t<{
        readonly comments: ReadonlyArray<Comment>;
      }>(),
    }),
  }),
});

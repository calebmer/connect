import {AccessToken, RefreshToken} from "./types/TokenTypes";
import {AccountID, AccountProfile} from "./types/AccountTypes";
import {Comment, CommentID, PostCommentEvent} from "./types/CommentTypes";
import {DateTime, Group, GroupID} from "./types/GroupTypes";
import {Post, PostCursor, PostID} from "./types/PostTypes";
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
        readonly accountID: AccountID;
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
        readonly accountID: AccountID;
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
     *
     * If the current account’s profile does not exist then we throw a “not
     * found” error.
     */
    getCurrentProfile: Schema.method({
      safe: true,
      input: {},
      output: SchemaOutput.t<{
        readonly account: AccountProfile;
      }>(),
    }),

    /**
     * Get the profile for an account that is in at least one of the same groups
     * as us.
     *
     * If we are not allowed to see this profile or the profile does not exist
     * then the method returns null.
     */
    getProfile: Schema.method({
      safe: true,
      input: {id: SchemaInput.integer<AccountID>()},
      output: SchemaOutput.t<{readonly account: AccountProfile | null}>(),
    }),

    /**
     * Gets some public account profiles.
     *
     * If we are not allowed to see a profile or a profile does not exist
     * then the method will not return an element for that profile in the array
     * but will attempt to return other existing accounts.
     */
    getManyProfiles: Schema.method({
      safe: true,
      input: {ids: SchemaInput.array(SchemaInput.integer<AccountID>())},
      output: SchemaOutput.t<{
        readonly accounts: ReadonlyArray<AccountProfile>;
      }>(),
    }),
  }),

  group: Schema.namespace({
    /**
     * Fetches a group by its slug which was likely taken from a URL.
     *
     * If we are not allowed to see a group or the group does not exist then
     * the method returns null.
     */
    getGroupBySlug: Schema.method({
      safe: true,
      input: {slug: SchemaInput.string()},
      output: SchemaOutput.t<{readonly group: Group | null}>(),
    }),
  }),

  post: Schema.namespace({
    /**
     * Fetches a post with the provided ID.
     *
     * If we are not allowed to see a group or the group does not exist then
     * the method returns null.
     */
    getPost: Schema.method({
      safe: true,
      input: {id: SchemaInput.string<PostID>()},
      output: SchemaOutput.t<{readonly post: Post | null}>(),
    }),

    /**
     * Gets a list of the posts in a group in reverse chronological order.
     * If the person is not a member of the group or the group does not exist,
     * we will throw a “not found” error.
     *
     * Uses cursor based pagination to only select a subset of posts. We always
     * require a limit to avoid selecting the entire table.
     */
    getGroupPosts: Schema.method({
      safe: true,
      input: {
        groupID: SchemaInput.integer<GroupID>(),
        ...RangeInputFields<PostCursor>(),
      },
      output: SchemaOutput.t<{
        readonly posts: ReadonlyArray<Post>;
      }>(),
    }),

    /**
     * Publishes a new post in the provided group. If the authorized user is not
     * a member of the group then we will throw an unauthorized error.
     *
     * We give the client the ability to generate a new ID for the post. That
     * way the client can create an “optimistic” post for display in the UI.
     *
     * Only the server gets to decide the definitive time a post was published
     * at. Since the time will be independent of time zones or skewed client
     * device clocks.
     *
     * Only returns the the time the server decided the post was published to
     * avoid sending all the content back over the network.
     */
    publishPost: Schema.method({
      safe: false,
      input: {
        id: SchemaInput.string<PostID>(),
        groupID: SchemaInput.integer<GroupID>(),
        content: SchemaInput.string(),
      },
      output: SchemaOutput.t<{
        readonly publishedAt: DateTime;
      }>(),
    }),
  }),

  comment: Schema.namespace({
    /**
     * Fetches a comment with the provided ID.
     *
     * If we are not allowed to see a group or the group does not exist then
     * the method returns null.
     */
    getComment: Schema.method({
      safe: true,
      input: {id: SchemaInput.string<CommentID>()},
      output: SchemaOutput.t<{readonly comment: Comment | null}>(),
    }),

    /**
     * All of the comment replies to a post. Sorted by the time they were posted
     * with the first comments at the beginning of the list.
     *
     * Unlike `getGroupPosts` we use limit/offset pagination. Using offsets is
     * safe here because published comments are always added to the _end_ of the
     * list and never the beginning.
     *
     * NOTE: As a default, always use cursor pagination! Limit/offset pagination
     * only makes sense here because of the UI we are using. See `getGroupPosts`
     * as an example of cursor pagination.
     */
    getPostComments: Schema.method({
      safe: true,
      input: {
        postID: SchemaInput.string<PostID>(),
        limit: SchemaInput.number(),
        offset: SchemaInput.number(),
      },
      output: SchemaOutput.t<{
        readonly comments: ReadonlyArray<Comment>;
      }>(),
    }),

    /**
     * Publishes a new comment on the provided post. If the authorized user is
     * not a member of the group the post was published in then we will throw an
     * unauthorized error.
     *
     * We give the client the ability to generate a new ID for the comment. That
     * way the client can create an “optimistic” comment for display in the UI.
     *
     * Only the server gets to decide the definitive time a comment was
     * published at. Since the time will be independent of time zones or skewed
     * client device clocks.
     *
     * Only returns the the time the server decided the comment was published to
     * avoid sending all the content back over the network.
     */
    publishComment: Schema.method({
      safe: false,
      input: {
        id: SchemaInput.string<CommentID>(),
        postID: SchemaInput.string<PostID>(),
        content: SchemaInput.string(),
      },
      output: SchemaOutput.t<{
        readonly publishedAt: DateTime;
      }>(),
    }),

    /**
     * Watches the comments being posted in realtime on an individual post. As
     * input you must specify the particular post ID. As new comments are posted
     * the subscription will notify any listeners.
     *
     * Whenever a client first subscribes we will check to make sure it has
     * access to the post the client is subscribing to. We currently _won‘t_
     * close the connection if a client loses their access to a post
     * while subscribed.
     */
    watchPostComments: Schema.subscription({
      input: {
        postID: SchemaInput.string<PostID>(),
      },
      message: SchemaOutput.t<PostCommentEvent>(),
    }),
  }),
});

import {
  AccountID,
  Comment,
  CommentID,
  DateTime,
  Group,
  GroupID,
  Post,
  PostID,
  generateID,
} from "@connect/api-client";
import {ContextTest} from "./ContextTest";
import {sql} from "./pg/SQL";

// Don’t allow this module to be used outside of a testing environment.
if (!__TEST__) {
  throw new Error("Can only use factories in a test environment.");
}

/**
 * Creates a new sequence that is unique for each `ContextTest` instance and
 * starts at 1.
 */
function createSequence(): (ctx: ContextTest) => number {
  const counters = new WeakMap<ContextTest, number>();
  return ctx => {
    let n = counters.get(ctx);
    if (n === undefined) n = 1;
    counters.set(ctx, n + 1);
    return n;
  };
}

function maybeCreate<ID, Config>(
  factory: (ctx: ContextTest, config?: Config) => Promise<{id: ID}>,
) {
  return (
    ctx: ContextTest,
    value: ID | undefined,
    config?: Config,
  ): Promise<ID> => {
    if (value !== undefined) {
      return Promise.resolve(value);
    } else {
      return factory(ctx, config).then(({id}) => id);
    }
  };
}

/** This is the password hash for literally the string “password” */
const simplePasswordHash =
  "$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.";

const accountSequence = createSequence();
const groupSequence = createSequence();
const postSequence = createSequence();
const commentSequence = createSequence();

const maybeCreateAccount = maybeCreate(createAccount);
const maybeCreateGroup = maybeCreate(createGroup);
const maybeCreatePost = maybeCreate(createPost);

////////////////////////////////////////////////////////////////////////////////

type FactoryAccount = {
  id: AccountID;
  name: string;
  avatarURL: string | null;
};

export async function createAccount(ctx: ContextTest): Promise<FactoryAccount> {
  const id = generateID<AccountID>();
  const n = accountSequence(ctx);

  const name = `Test ${n}`;
  const email = `test${n}@example.com`;
  const passwordHash = simplePasswordHash;

  await ctx.query(sql`
    INSERT INTO account (id, name, email, password_hash)
         VALUES (${id}, ${name}, ${email}, ${passwordHash})
  `);

  return {
    id,
    name,
    avatarURL: null,
  };
}

type FactoryGroupConfig = {
  slug?: true | string | null;
};

export async function createGroup(
  ctx: ContextTest,
  config: FactoryGroupConfig = {},
): Promise<Group> {
  const id = generateID<GroupID>();
  const n = groupSequence(ctx);

  const slug =
    config.slug === true || config.slug === undefined
      ? `group${n}`
      : config.slug !== null
      ? config.slug
      : null;

  const name = `Group ${n}`;

  const ownerID = (await createAccount(ctx)).id;

  await ctx.query(sql`
    INSERT INTO "group" (id, slug, name, owner_id)
         VALUES (${id}, ${slug}, ${name}, ${ownerID})
  `);

  return {
    id,
    slug,
    name,
  };
}

type FactoryGroupMemberConfig = {
  accountID?: AccountID;
  groupID?: GroupID;
  joinedAt?: DateTime;
};

type FactoryGroupMember = {
  accountID: AccountID;
  groupID: GroupID;
  joinedAt: DateTime;
};

export async function createGroupMember(
  ctx: ContextTest,
  config: FactoryGroupMemberConfig = {},
): Promise<FactoryGroupMember> {
  const [accountID, groupID] = await Promise.all([
    maybeCreateAccount(ctx, config.accountID),
    maybeCreateGroup(ctx, config.groupID),
  ]);

  const joinedAt = config.joinedAt || DateTime.now();

  await ctx.query(sql`
    INSERT INTO group_member (account_id, group_id, joined_at)
         VALUES (${accountID}, ${groupID}, ${joinedAt})
  `);

  return {
    accountID,
    groupID,
    joinedAt,
  };
}

type FactoryPostConfig = {
  groupID?: GroupID;
  authorID?: AccountID;
  publishedAt?: DateTime;
};

// https://en.wikipedia.org/wiki/The_Impossible_Astronaut
const startPublishedAt = Date.parse("2011-04-22 16:30:00");

export async function createPost(
  ctx: ContextTest,
  config: FactoryPostConfig = {},
): Promise<Post> {
  const id = generateID<PostID>();
  const n = postSequence(ctx);

  const {groupID, accountID: authorID} = await createGroupMember(ctx, {
    groupID: config.groupID,
    accountID: config.authorID,
  });

  const content = `Post Content ${n}`;
  const publishedAt = config.publishedAt
    ? config.publishedAt
    : (new Date(
        startPublishedAt + 1000 * 60 * 60 * (n - 1),
      ).toISOString() as DateTime);

  await ctx.query(sql`
    INSERT INTO post (id, group_id, author_id, published_at, content)
         VALUES (${id}, ${groupID}, ${authorID}, ${publishedAt}, ${content})
  `);

  return {
    id,
    groupID,
    authorID,
    publishedAt,
    commentCount: 0,
    content,
  };
}

type FactoryCommentConfig = {
  groupID?: GroupID; // Not used if a `postID` is provided.
  postID?: PostID;
  authorID?: AccountID;
};

// https://en.wikipedia.org/wiki/The_Impossible_Astronaut
const startPostedAt = Date.parse("2011-04-22 16:30:00");

export async function createComment(
  ctx: ContextTest,
  config: FactoryCommentConfig = {},
): Promise<Comment> {
  const id = generateID<CommentID>();
  const n = commentSequence(ctx);

  const [postID, authorID] = await Promise.all([
    maybeCreatePost(ctx, config.postID, {groupID: config.groupID}),
    maybeCreateAccount(ctx, config.authorID),
  ]);

  const content = `Comment Content ${n}`;
  const publishedAt = new Date(
    startPostedAt + 1000 * 60 * 60 * (n - 1),
  ).toISOString() as DateTime;

  await ctx.query(sql`
    INSERT INTO comment (id, post_id, author_id, published_at, content)
         VALUES (${id}, ${postID}, ${authorID}, ${publishedAt}, ${content})
  `);

  return {
    id,
    postID,
    authorID,
    publishedAt,
    content,
  };
}

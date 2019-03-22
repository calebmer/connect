import {AccountID, DateTime, GroupID, PostID} from "@connect/api-client";
import {ContextTest} from "./ContextTest";
import {TEST} from "./RunConfig";
import {sql} from "./PGSQL";

// Don’t allow this module to be used outside of a testing environment.
if (!TEST) {
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

const accountSequence = createSequence();
const groupSequence = createSequence();
const postSequence = createSequence();

/** This is the password hash for literally the string “password” */
const simplePasswordHash =
  "$2b$10$cktmQOA38JT0RG/1IUaAVuzWjrAj9Vs4bdRgdLBInJX9qf4TFWma.";

function maybeCreate<ID>(
  factory: (ctx: ContextTest) => Promise<{id: ID}>,
  ctx: ContextTest,
  value: ID | undefined,
): Promise<ID> {
  if (value !== undefined) {
    return Promise.resolve(value);
  } else {
    return factory(ctx).then(({id}) => id);
  }
}

////////////////////////////////////////////////////////////////////////////////

type FactoryAccount = {
  id: AccountID;
};

export async function createAccount(ctx: ContextTest): Promise<FactoryAccount> {
  const n = accountSequence(ctx);

  const name = `Test ${n}`;
  const email = `test${n}@example.com`;
  const passwordHash = simplePasswordHash;

  const {
    rows: [row],
  } = await ctx.query(sql`
    INSERT INTO account (name, email, password_hash)
         VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id
  `);

  return {
    id: row.id,
  };
}

type FactoryGroup = {
  id: GroupID;
  slug: string;
  name: string;
};

export async function createGroup(ctx: ContextTest): Promise<FactoryGroup> {
  const n = groupSequence(ctx);

  const slug = `group${n}`;
  const name = `Group ${n}`;

  const ownerID = (await createAccount(ctx)).id;

  const {
    rows: [row],
  } = await ctx.query(sql`
    INSERT INTO "group" (slug, name, owner_id)
         VALUES (${slug}, ${name}, ${ownerID})
      RETURNING id
  `);

  return {
    id: row.id,
    slug,
    name,
  };
}

type FactoryGroupMemberConfig = {
  accountID?: AccountID;
  groupID?: GroupID;
};

type FactoryGroupMember = {
  accountID: AccountID;
  groupID: GroupID;
};

export async function createGroupMember(
  ctx: ContextTest,
  config: FactoryGroupMemberConfig = {},
): Promise<FactoryGroupMember> {
  const [accountID, groupID] = await Promise.all([
    maybeCreate(createAccount, ctx, config.accountID),
    maybeCreate(createGroup, ctx, config.groupID),
  ]);

  await ctx.query(sql`
    INSERT INTO group_member (account_id, group_id)
         VALUES (${accountID}, ${groupID})
  `);

  return {
    accountID,
    groupID,
  };
}

type FactoryPostConfig = {
  groupID?: GroupID;
  authorID?: AccountID;
};

type FactoryPost = {
  id: PostID;
  groupID: GroupID;
  authorID: AccountID;
  content: string;
  publishedAt: DateTime;
};

// https://en.wikipedia.org/wiki/The_Impossible_Astronaut
const startPublishedAt = Date.parse("2011-04-22 16:30:00");

export async function createPost(
  ctx: ContextTest,
  config: FactoryPostConfig = {},
): Promise<FactoryPost> {
  const n = postSequence(ctx);

  const [groupID, authorID] = await Promise.all([
    maybeCreate(createGroup, ctx, config.groupID),
    maybeCreate(createAccount, ctx, config.authorID),
  ]);

  const content = `Post Content ${n}`;
  const publishedAt = new Date(
    startPublishedAt + 1000 * 60 * 60 * (n - 1),
  ).toISOString() as DateTime;

  const {
    rows: [row],
  } = await ctx.query(sql`
    INSERT INTO post (group_id, author_id, content, published_at)
         VALUES (${groupID}, ${authorID}, ${content}, ${publishedAt})
      RETURNING id
  `);

  return {
    id: row.id,
    groupID,
    authorID,
    content,
    publishedAt,
  };
}

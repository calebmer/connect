import {
  createAccount,
  createComment,
  createGroupMember,
} from "../../TestFactory";
import {ContextTest} from "../../ContextTest";
import {generateID} from "@connect/api-client";
import {sql} from "../../pg/SQL";

describe("Postgres", () => {
  test("comment inbox messages require a comment ID", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      let error: any;
      try {
        await ctx.query(sql`
          INSERT INTO inbox (id, recipient_id, kind, comment_id)
              VALUES (${generateID()}, ${account.id}, 'comment', NULL)
        `);
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
      expect(error.message).toMatch("kind_comment");
    });
  });

  test("cannot select inbox messages you don’t own", () => {
    return ContextTest.with(async ctx => {
      const {groupID, accountID: accountID1} = await createGroupMember(ctx);
      const {accountID: accountID2} = await createGroupMember(ctx, {groupID});
      const comment = await createComment(ctx, {groupID});

      await ctx.query(sql`
        INSERT INTO inbox (id, recipient_id, kind, comment_id)
             VALUES (${generateID()}, ${accountID1}, 'comment', ${comment.id})
      `);

      await ctx.withAuthorized(accountID1, async ctx => {
        expect((await ctx.query(sql`SELECT 1 FROM inbox`)).rowCount).toEqual(1);
      });

      await ctx.withAuthorized(accountID2, async ctx => {
        expect((await ctx.query(sql`SELECT 1 FROM inbox`)).rowCount).toEqual(0);
      });
    });
  });
});

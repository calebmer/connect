import {
  APIError,
  APIErrorCode,
  AccountID,
  DateTime,
  GroupID,
} from "@connect/api-client";
import {MockGroupCollection} from "../../entities/Group";
import {getBySlug} from "../Group";

const accountID1 = 0 as AccountID;

const groupID1 = 0 as GroupID;
const groupID2 = 1 as GroupID;

describe("getBySlug", () => {
  test("will not return a group if the group does not exist", async () => {
    const joinedAt = new Date().toISOString() as DateTime;
    const groups = new MockGroupCollection([
      {
        group: {id: groupID1, slug: "a", name: "A"},
        memberships: [{groupID: groupID1, accountID: accountID1, joinedAt}],
        posts: [],
      },
    ]);

    let error: any;
    try {
      await getBySlug({groups}, accountID1, {slug: "b"});
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.NOT_FOUND);
  });

  test("will not return a group if the account is not a member", async () => {
    const groups = new MockGroupCollection([
      {group: {id: groupID1, slug: "a", name: "A"}, memberships: [], posts: []},
    ]);

    let error: any;
    try {
      await getBySlug({groups}, accountID1, {slug: "a"});
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.NOT_FOUND);
  });

  test("will not return a group if the account is a member of a different group", async () => {
    const joinedAt = new Date().toISOString() as DateTime;
    const groups = new MockGroupCollection([
      {group: {id: groupID1, slug: "a", name: "A"}, memberships: [], posts: []},
      {
        group: {id: groupID2, slug: "b", name: "B"},
        memberships: [{groupID: groupID2, accountID: accountID1, joinedAt}],
        posts: [],
      },
    ]);

    let error: any;
    try {
      await getBySlug({groups}, accountID1, {slug: "a"});
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.NOT_FOUND);
  });

  test("will not return a group the account is a member of", async () => {
    const joinedAt = new Date().toISOString() as DateTime;
    const groups = new MockGroupCollection([
      {group: {id: groupID1, slug: "a", name: "A"}, memberships: [], posts: []},
      {
        group: {id: groupID2, slug: "b", name: "B"},
        memberships: [{groupID: groupID2, accountID: accountID1, joinedAt}],
        posts: [],
      },
    ]);

    const group = await getBySlug({groups}, accountID1, {slug: "b"});

    expect(group).toEqual({group: {id: groupID2, slug: "b", name: "B"}});
  });
});

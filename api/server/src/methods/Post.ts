import {Comment} from "@connect/api-client";

export async function getComments(): Promise<{
  readonly comments: ReadonlyArray<Comment>;
}> {
  throw new Error("TODO");
}

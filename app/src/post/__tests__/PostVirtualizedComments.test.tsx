import {test_getIndex as getIndex} from "../PostVirtualizedComments";

describe("getIndex", () => {
  // NOTE: This was test case was extracted from an actual bug found
  // in `PostVirtualizedComments`.
  test("will get the correct index when there is a leading and trailing chunk", () => {
    const commentChunks = [
      {start: 0, length: 16, height: 962},
      {start: 580, length: 15, height: 1035},
    ];
    // prettier-ignore
    const commentHeights = [
      89, 56, 56, 56, 56, 56, 56, 56, 56, 89, 56, 56, 56, 56, 56, 56,
      ...Array(564).fill(undefined),
      65, 32, 32, 32, 32, 113, 80, 80, 80, 80, 80, 80, 80, 80, 89,
    ];
    const maxOffset = 41518.96296296296;

    expect(getIndex(commentChunks, commentHeights, maxOffset)).toEqual(580);
  });
});

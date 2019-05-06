import {
  Dimensions,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from "react-native";
import {Font, Space} from "../atoms";
import React, {ReactElement} from "react";
import {Comment} from "../comment/Comment";
import {CommentShimmer} from "../comment/CommentShimmer";
import {Post} from "@connect/api-client";
import {PostCommentsCacheEntry} from "../comment/CommentCache";
import {Skimmer} from "../cache/Skimmer";

// The number of items to render outside of the viewport range.
const overscanCount = 1;

type Props = {
  /**
   * The post we are rendering comments on.
   */
  post: Post;

  /**
   * The comments for our post. If an entry is `Skimmer.empty` that means the
   * comment has not yet loaded.
   */
  comments: ReadonlyArray<PostCommentsCacheEntry | typeof Skimmer.empty>;

  /**
   * HACK: We want this component to have access to the `onScroll` event but we
   * don’t render the scroll view. Our parent is responsible for rendering the
   * scroll view. So we use a ref to pass “up” an event handler to our
   * parent component.
   */
  onScroll: React.MutableRefObject<
    null | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
  >;
};

type State = {
  /**
   * The currently visible range of items.
   */
  visibleRange: {
    first: number;
    last: number;
  };

  /**
   * The heights of all the comments we’ve rendered. Gaps in the comment list
   * (`Skimmer.empty`) are represented with `undefined`.
   */
  commentHeights: ReadonlyArray<number | undefined>;

  /**
   * An alternative view of `commentHeights` where a sequence of contiguous
   * comments forms a chunk.
   */
  commentChunks: ReadonlyArray<CommentChunk>;
};

/**
 * A sequence of contiguous comments whose layouts have been measured.
 */
type CommentChunk = {
  /** The index at the start of the chunk. */
  start: number;
  /** The number of comments in the chunk. */
  length: number;
  /** The total height of the chunk. */
  height: number;
};

export class PostVirtualizedComments extends React.Component<Props, State> {
  /**
   * The expected scroll event throttle for our component.
   */
  static scrollEventThrottle = 50;

  constructor(props: Props) {
    super(props);

    const first = 0;

    // Estimate the maximum number of comments that can fit on screen at
    // a time.
    const last = Math.ceil(
      (Dimensions.get("screen").height * 0.75) / (Font.size2.lineHeight * 2),
    );

    this.state = {
      visibleRange: {
        first,
        last,
      },
      commentHeights: [],
      commentChunks: [],
    };
  }

  componentDidMount() {
    // HACK: Set our scroll handler to the mutable ref. This is how we “pass up”
    // our event handler.
    this.props.onScroll.current = this.handleScroll;
  }

  componentWillUnmount() {
    this.props.onScroll.current = null;

    // If we are unmounting but there are some layouts we were waiting to update
    // then clear the timeout.
    if (this.pendingCommentHeights !== null) {
      clearTimeout(this.pendingCommentHeights.timeoutID);
    }
  }

  /**
   * Information from the last scroll event that we use to compute the average
   * velocity of a scroll sequence over time.
   */
  private lastScroll: {
    timestamp: number;
    offset: number;
  } | null = null;

  /**
   * Handles a scroll event by measuring the items we should be rendering and
   * updating state if it changed.
   */
  private handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const commentCount = this.props.post.commentCount;

    // Get the range of visible content in the scroll view from the event.
    const timestamp = event.timeStamp;
    const offset = event.nativeEvent.contentOffset.y;
    const viewport = event.nativeEvent.layoutMeasurement.height;

    // Get the begin and end offset for the visible content.
    let firstOffset = offset;
    let lastOffset = offset + viewport;

    // If we’ve scrolled recently then measure the velocity of our scrolling and
    // extend the bounds of the items we want to render to cover the distance
    // the user will scroll before our scroll event handler will run again.
    if (
      this.lastScroll !== null &&
      timestamp - this.lastScroll.timestamp <
        PostVirtualizedComments.scrollEventThrottle
    ) {
      // Get the average velocity between this scroll and the last scroll.
      const velocity =
        (offset - this.lastScroll.offset) /
        (timestamp - this.lastScroll.timestamp);

      // Estimate how many items we’ll scroll before the next scroll event.
      const estimatedOffset =
        velocity * PostVirtualizedComments.scrollEventThrottle;

      // Add the estimated offset so that we render enough items while the user
      // is scrolling before the next scroll event which will recalculate again.
      if (estimatedOffset > 0) {
        lastOffset += estimatedOffset;
      } else {
        firstOffset += estimatedOffset;
      }
    }

    // Record the timestamp and offset of the last scroll event for future
    // velocity calculations.
    this.lastScroll = {timestamp, offset};

    // Get the beginning index of visible items.
    let first = this.getIndex(firstOffset) - 1 - overscanCount;
    if (first < 0) first = 0;

    // Get the ending index of visible items.
    let last = this.getIndex(lastOffset) + overscanCount;
    if (last > commentCount) last = commentCount;

    // Update the visible range if it changed.
    this.setState(prevState => {
      if (
        prevState.visibleRange.first === first &&
        prevState.visibleRange.last === last
      ) {
        return null;
      }
      return {
        visibleRange: {first, last},
      };
    });
  };

  /**
   * When we detect a layout change in a comment, we wait to see if other
   * comments have layout changes as well.
   */
  private pendingCommentHeights: {
    timeoutID: number;
    heights: Array<{index: number; height: number}>;
  } | null = null;

  /**
   * When a comment’s layout changes we fire this event...
   */
  private handleCommentLayout(index: number, event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height;

    // If we already have the correct height for this comment in our state
    // then don’t bother scheduling an update.
    if (height === this.state.commentHeights[index]) return;

    // We will actually update our state after `setTimeout(f, 0)` finishes. That
    // way if we have, say, five comments which fire their layout events
    // together we’ll only update our state once.
    if (this.pendingCommentHeights === null) {
      const timeoutID = setTimeout(() => this.flushCommentHeights(), 0);
      this.pendingCommentHeights = {timeoutID, heights: []};
    }

    // Add the pending comment height.
    this.pendingCommentHeights.heights.push({
      index,
      height,
    });
  }

  /**
   * We wait until we‘ve collected as many comment heights as we can before
   * flushing them to our state.
   */
  private flushCommentHeights() {
    // If we have no pending comment heights do nothing.
    if (this.pendingCommentHeights === null) return;

    // Reset our pending comment heights.
    const pendingCommentHeights = this.pendingCommentHeights.heights;
    this.pendingCommentHeights = null;

    this.setState(prevState => {
      let newCommentHeights: Array<number | undefined> | undefined;

      // Process our pending comment heights...
      for (let i = 0; i < pendingCommentHeights.length; i++) {
        const {index, height} = pendingCommentHeights[i];

        // If the height did not change then do nothing.
        if (prevState.commentHeights[index] === height) continue;

        // If this is the first height that changed then clone our previous
        // comment heights state.
        if (newCommentHeights === undefined) {
          newCommentHeights = prevState.commentHeights.slice();
        }

        // If our comment heights array is to small for this index then make
        // sure to fill it up with `push()`.
        if (newCommentHeights.length < index) {
          for (let k = newCommentHeights.length; k <= index; k++) {
            newCommentHeights.push(k === index ? height : undefined);
          }
        } else {
          newCommentHeights[index] = height;
        }
      }

      // If none of our comment heights changed then don’t update our state!
      if (newCommentHeights === undefined) {
        return null;
      } else {
        // Otherwise, let’s compute our new comment chunks!
        const newCommentChunks: Array<CommentChunk> = [];

        // Loop through all of our comment heights...
        let currentChunk: CommentChunk | undefined;
        for (let i = 0; i < newCommentHeights.length; i++) {
          const height = newCommentHeights[i];

          if (height !== undefined) {
            if (currentChunk === undefined) {
              // If we have a comment height but no chunk then let’s create a
              // new chunk.
              currentChunk = {start: i, length: 1, height};
              newCommentChunks.push(currentChunk);
            } else {
              // If we have a height and a chunk then let’s add to the chunk.
              currentChunk.length += 1;
              currentChunk.height += height;
            }
          } else {
            // If we do not have a height but we do have a chunk then unset the
            // chunk. Next time we see a height we’ll want to create a
            // new chunk.
            if (currentChunk !== undefined) {
              currentChunk = undefined;
            }
          }
        }

        return {
          commentHeights: newCommentHeights,
          commentChunks: newCommentChunks,
        };
      }
    });
  }

  /**
   * Gets the offset above the item at a given index.
   *
   * The dual of this function is `getIndex()` where we can get an index from
   * an offset.
   */
  private getOffset(maxIndex: number): number {
    // Set the initial offset and index. The offset is a distance in measurement
    // units. The index is a position in our comments list.
    let offset = 0;
    let index = 0;

    // Loop through our comment chunks...
    for (let i = 0; i < this.state.commentChunks.length; i++) {
      const commentChunk = this.state.commentChunks[i];

      // We expect `commentChunks` to be sorted by `commentChunk.index` and we
      // expect that `index` will never exceed the next comment chunk’s starting
      // position based on our implementation below. If these expectations are
      // violated then throw.
      if (index > commentChunk.start) {
        throw new Error(
          `Expected ${index} to be less than or equal to ${
            commentChunk.start
          }.`,
        );
      }

      // If our index is less than the next chunk’s starting position then let’s
      // catch up our index to the chunk start.
      if (index < commentChunk.start) {
        // If moving our index to the chunk’s starting index would take us over
        // the maximum index then move our index to the maximum index and break
        // out of the loop. We done.
        if (maxIndex < commentChunk.start) {
          offset += CommentShimmer.getHeight(maxIndex - index, index);
          index = maxIndex;
          break;
        }

        // The area between comment chunks are occupied by `CommentShimmer`
        // components which have a known height. Add that to our offset.
        offset += CommentShimmer.getHeight(commentChunk.start - index, index);
        index = commentChunk.start;
      }

      // At this point, we expect our index to match the start of our
      // comment chunk. We handle both the less than and greater than cases
      // above which will either break out of the loop or set the index equal
      // to our comment chunk start.
      if (index !== commentChunk.start)
        throw new Error(`Expected ${index} to equal ${commentChunk.start}.`);

      // Add this comment chunk’s height to our offset as long as that wouldn’t
      // put us over our `maxIndex`.
      if (index + commentChunk.length <= maxIndex) {
        offset += commentChunk.height;
        index += commentChunk.length;

        // If `index === maxIndex` now then break out of the loop. We’re
        // done here.
        if (index < maxIndex) {
          continue;
        } else {
          break;
        }
      }

      // If adding the entire chunk height would put us over our `maxIndex` then
      // add each comment height to the offset individually. We expect there
      // to be a height for each comment since the comment’s are inside our
      // current chunk.
      while (index < maxIndex) {
        const height = this.state.commentHeights[index];
        if (height === undefined) throw new Error("Expected height.");
        offset += height;
        index += 1;
      }

      break;
    }

    // If we our index is still less than our `maxIndex` then let’s add the
    // remaining shimmer height. This could happen when there are fewer chunks
    // then items in the list.
    if (index < maxIndex) {
      offset += CommentShimmer.getHeight(maxIndex - index, index);
      index = maxIndex;
    }

    // Finally, we expect throughout all of this code that in the end our index
    // will end up equaling our `maxIndex`.
    if (index !== maxIndex)
      throw new Error(`Expected ${index} to equal ${maxIndex}.`);

    return offset;
  }

  /**
   * Gets the index of a comment based on its offset in the list.
   *
   * The dual of this operation is `getOffset()` which gets the offset of an
   * item in the list.
   */
  private getIndex(maxOffset: number): number {
    // Set the initial offset and index. The offset is a distance in measurement
    // units. The index is a position in our comments list.
    let offset = 0;
    let index = 0;

    // Loop through our comment chunks...
    for (let i = 0; i < this.state.commentChunks.length; i++) {
      const commentChunk = this.state.commentChunks[i];

      // We expect `commentChunks` to be sorted by `commentChunk.index` and we
      // expect that `index` will never exceed the next comment chunk’s starting
      // position based on our implementation below. If these expectations are
      // violated then throw.
      if (index > commentChunk.start) {
        throw new Error(
          `Expected ${index} to be less than or equal to ${
            commentChunk.start
          }.`,
        );
      }

      // Increase our offset by the height of comment shimmers between our
      // current index and the start of the next chunk.
      offset += CommentShimmer.getHeight(commentChunk.start - index, index);

      // If adding the shimmers surpassed the max offset, then let’s get
      // our specific index inside the shimmers and break out of the comment
      // chunk loop.
      if (offset >= maxOffset) {
        index += CommentShimmer.getIndex(maxOffset - offset, index);
        offset = maxOffset;
        break;
      }

      // Otherwise, our index is now moved to the comment chunk’s start.
      index = commentChunk.start;

      // If increasing the offset by the comment chunk length puts us above our
      // desired offset then we move backwards through the comment list to
      // arrive at the correct index.
      if (offset + commentChunk.height >= maxOffset) {
        while (offset < maxOffset) {
          // We expect a comment height to exist since we are inside a
          // comment chunk.
          offset += this.state.commentHeights[index]!;
          index += 1;
        }
        offset = maxOffset;
        break;
      }

      // Otherwise, increase our index by the comment chunk length.
      offset += commentChunk.height;
      index += commentChunk.length;
    }

    // If we run out of comment chunks but we are still below our desired offset
    // then use comment shimmers to get to our final offset.
    if (offset < maxOffset) {
      index += CommentShimmer.getIndex(maxOffset - offset, index);
      offset = maxOffset;
    }

    return index;
  }

  private renderFiller() {
    const height = this.getOffset(this.props.post.commentCount) + Space.space3;
    return <View style={{height}} />;
  }

  private renderItems(
    first: number,
    last: number,
  ): ReadonlyArray<ReactElement> {
    const itemsCount = last - first;
    const items = Array<ReactElement>(itemsCount);

    for (let i = 0; i < itemsCount; i++) {
      items[i] = this.renderItem(first + i);
    }

    return items;
  }

  private renderItem(index: number): ReactElement {
    const comment = this.props.comments[index];
    const lastComment = this.props.comments[index - 1];
    const commentHeight = this.state.commentHeights[index];

    const style = {
      position: "absolute" as "absolute",
      top: this.getOffset(index),
      left: 0,
      right: 0,
    };

    // On web, use a `div` directly which is more efficient since we don’t
    // need the extra component.
    const ViewComponent = Platform.OS === "web" ? "div" : View;

    return (
      <React.Fragment key={index}>
        {isComment(comment) && (
          <View
            style={[style, commentHeight === undefined && {opacity: 0}]}
            onLayout={event => this.handleCommentLayout(index, event)}
          >
            <Comment
              commentID={comment.id}
              lastCommentID={isComment(lastComment) ? lastComment.id : null}
            />
          </View>
        )}
        {(!isComment(comment) || commentHeight === undefined) && (
          <ViewComponent style={style}>
            <CommentShimmer index={index} />
          </ViewComponent>
        )}
      </React.Fragment>
    );
  }

  render() {
    const {visibleRange} = this.state;

    return (
      <>
        {this.renderFiller()}
        {this.renderItems(visibleRange.first, visibleRange.last)}
      </>
    );
  }
}

/**
 * Checks if an item from a `Skimmer` comments array is a comment.
 */
function isComment(
  comment: PostCommentsCacheEntry | typeof Skimmer.empty | undefined,
): comment is PostCommentsCacheEntry {
  return comment !== undefined && comment !== Skimmer.empty;
}

/**
 * Memoize all the results of a function. If we’ve seen an argument before at
 * any point in time then we will return the same value without recomputing
 * anything. If we haven’t seen the argument then we will compute the
 * return value.
 */
function memoize<Arg, Ret>(fn: (arg: Arg) => Ret): (arg: Arg) => Ret {
  const cache = new Map<Arg, Ret>();
  return arg => {
    let ret = cache.get(arg);
    if (ret === undefined) {
      ret = fn(arg);
      cache.set(arg, ret);
    }
    return ret;
  };
}

/**
 * Memoize the last result of the function. If the argument is the same then
 * we will return the same value without recomputing anything. If the argument
 * is different then we will recompute the return value.
 */
function memoizeLast<Arg, Ret>(fn: (arg: Arg) => Ret): (arg: Arg) => Ret {
  let last: {arg: Arg; ret: Ret} | undefined;
  return arg => {
    if (last !== undefined && last.arg === arg) {
      return last.ret;
    } else {
      const ret = fn(arg);
      last = {arg, ret};
      return ret;
    }
  };
}

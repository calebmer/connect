import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  ScrollEvent,
  ScrollView,
  View,
} from "react-native";
import {Font, Space} from "../atoms";
import {
  PostCommentsCacheEntry,
  commentCountMore,
} from "../comment/CommentCache";
import React, {ReactElement} from "react";
import {Comment} from "../comment/Comment";
import {CommentShimmer} from "../comment/CommentShimmer";
import {reactSchedulerFlushSync} from "../utils/forks/reactSchedulerFlushSync";

// The number of items to render outside of the viewport range.
//
// We always overscan by the number of comments we’ll incrementally fetch. That
// way when we load more comments, we’ll immediately render them and get
// their heights.
//
// This is a bit of a hack to fix the jankiness of loading each comment as it
// scrolls into view.
const overscanCount = commentCountMore;

// The number of items we will always render at the beginning of our list to
// improve perceived performance.
const leadingCount = commentCountMore / 2;

// The number of items we will always render at the end of our list to
// improve perceived performance.
const trailingCount = commentCountMore;

type Props = {
  /**
   * The total number of comments in our list. We will render a list that can
   * fit this many comments.
   */
  commentCount: number;

  /**
   * The underlying array of comments we will render. `undefined` comments are
   * represented with a comment shimmer. We will always render `commentCount`
   * number of comments. Whether or not that’s more or less than the actual
   * number of comments.
   */
  comments: ReadonlyArray<PostCommentsCacheEntry | undefined>;

  /**
   * A reference to the scroll view that our virtualized comment list
   * is inside.
   */
  scrollViewRef: React.RefObject<ScrollView>;

  /**
   * HACK: We want this component to have access to the `onScroll` event but we
   * don’t render the scroll view. Our parent is responsible for rendering the
   * scroll view. So we use a ref to pass “up” an event handler to our
   * parent component.
   */
  handleScroll: React.MutableRefObject<null | ((event: ScrollEvent) => void)>;

  /**
   * When the visible items change, we call this callback. The parent component
   * will use this to load more items.
   */
  onVisibleRangeChange: (range: RenderRange) => void;
};

type State = {
  /**
   * The currently visible range of items.
   */
  visibleRange: RenderRange;

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
 * A range of items to render.
 */
type RenderRange = {
  first: number;
  last: number;
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
    const last = Math.min(
      Math.ceil(
        (Dimensions.get("screen").height * 0.75) / (Font.size2.lineHeight * 2),
      ),
      this.props.commentCount,
    );

    this.state = {
      visibleRange: {first, last},
      commentHeights: [],
      commentChunks: [],
    };
  }

  /**
   * Has the browser painted this component yet? True if the browser has. This
   * is different from whether or not the component has rendered. The component
   * may render multiple times without a browser paint.
   */
  private hasPainted = false;

  componentDidMount() {
    // HACK: Set our scroll handler to the mutable ref. This is how we “pass up”
    // our event handler.
    this.props.handleScroll.current = this.handleScroll;

    // Report the initial visible range before scrolling.
    this.props.onVisibleRangeChange(this.state.visibleRange);

    // We determine whether or not the browser has painted with `setTimeout`.
    // It’s not perfect but it gets the job done. `setTimeout` schedules a
    // macro-task which will run after the browser paints. Unlike
    // `Promise.resolve()` which schedules a micro-task and will run before the
    // browser paints. `postMessage()` is perhaps a more reliable way to
    // determine if the browser has painted?
    //
    // `componentDidMount()` runs before the browser paints. However,
    // `useEffect()` will run after the browser paints. (I think? I might
    // be wrong.)
    setTimeout(() => {
      this.hasPainted = true;
    }, 0);
  }

  componentWillUnmount() {
    this.props.handleScroll.current = null;
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    // Report a change in the visible if there is one.
    if (
      prevState.visibleRange.first !== this.state.visibleRange.first ||
      prevState.visibleRange.last !== this.state.visibleRange.last
    ) {
      this.props.onVisibleRangeChange(this.state.visibleRange);
    }
  }

  /**
   * Handles a scroll event by measuring the items we should be rendering and
   * updating state if it changed.
   */
  private handleScroll = (event: ScrollEvent) => {
    // Skip scroll events if we haven’t gotten a layout event yet. This shouldn’t
    // happen? If it does the next scroll after a layout event will fix it.
    const postOffset = this.postOffset;
    if (postOffset === null) return;

    const commentCount = this.props.commentCount;

    // Get the range of visible content in the scroll view from the event.
    const offset = event.nativeEvent.contentOffset.y - postOffset;
    const viewport = event.nativeEvent.layoutMeasurement.height;

    // The viewport height hasn’t been measured yet.
    if (viewport === 0) return;

    // Get the begin and end offset for the visible content.
    const firstOffset = offset;
    const lastOffset = offset + viewport;

    // Get the beginning index of visible items.
    let first = getIndex(
      this.state.commentChunks,
      this.state.commentHeights,
      firstOffset,
    );
    first -= 1;
    if (first < 0) first = 0;

    // Get the ending index of visible items.
    let last = getIndex(
      this.state.commentChunks,
      this.state.commentHeights,
      lastOffset,
    );
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
   * The offset in measurement units of the post content rendered above our list
   * of comments.
   */
  private postOffset: number | null = null;

  /**
   * When the container’s layout changes we fire this event...
   */
  private handleContainerLayout = (event: LayoutChangeEvent) => {
    this.postOffset = event.nativeEvent.layout.y;
  };

  /**
   * When we detect a layout change in a comment, we wait to see if other
   * comments have layout changes as well.
   */
  private pendingCommentHeights: {
    important: boolean;
    heights: Array<{index: number; height: number}>;
  } | null = null;

  /**
   * When a comment’s layout changes we fire this event...
   */
  private handleCommentLayout: HandleCommentLayout = (
    index: number,
    comment: PostCommentsCacheEntry,
    event: LayoutChangeEvent,
  ) => {
    const height = event.nativeEvent.layout.height;

    // If we already have the correct height for this comment in our state
    // then don’t bother scheduling an update.
    if (height === this.state.commentHeights[index]) return;

    // We will actually update our state after `setTimeout(f, 0)` finishes. That
    // way if we have, say, five comments which fire their layout events
    // together we’ll only update our state once.
    if (this.pendingCommentHeights === null) {
      this.pendingCommentHeights = {important: false, heights: []};
      if (Platform.OS === "web") {
        // On web, schedule the flush in a micro-tick which will fire before the
        // next paint.
        Promise.resolve().then(() => {
          this.flushCommentHeights();
        });
      } else {
        // On native, use a macro-task since that’s what the message queue uses.
        setTimeout(() => {
          this.flushCommentHeights();
        }, 0);
      }
    }

    // Should we make this batch of pending comment heights important? The
    // answer is yes if:
    //
    // 1. If the browser has not painted then we don’t want to show a flash of
    //    unmeasured comments so we will synchronously re-render to avoid
    //    the flash.
    //
    // 2. If the comment is already measured. If a comment changes size then we
    //    need to immediately re-layout everything. If we let the browser paint
    //    the new comment then the list will look weird since the comment will
    //    fill up more or less of its height.
    //
    // 3. If a comment being measured is a realtime comment. When a comment is
    //    added in realtime we don’t want to see the flash of an
    //    unmeasured comment.
    this.pendingCommentHeights.important =
      this.pendingCommentHeights.important ||
      this.hasPainted === false ||
      this.state.commentHeights[index] !== undefined ||
      comment.realtime === true;

    // Add the pending comment height.
    this.pendingCommentHeights.heights.push({index, height});
  };

  /**
   * We wait until we‘ve collected as many comment heights as we can before
   * flushing them to our state.
   */
  private flushCommentHeights() {
    // If we have no pending comment heights do nothing.
    if (this.pendingCommentHeights === null) return;

    // Reset our pending comment heights.
    const pendingCommentHeights = this.pendingCommentHeights;
    this.pendingCommentHeights = null;

    function updateState(prevState: State) {
      let newCommentHeights: Array<number | undefined> | undefined;

      // Process our pending comment heights...
      for (let i = 0; i < pendingCommentHeights.heights.length; i++) {
        const {index, height} = pendingCommentHeights.heights[i];

        // If the height did not change then do nothing.
        if (prevState.commentHeights[index] === height) continue;

        // If this is the first height that changed then clone our previous
        // comment heights state.
        if (newCommentHeights === undefined) {
          newCommentHeights = prevState.commentHeights.slice();
        }

        // Set the new height in our new comment heights array.
        newCommentHeights[index] = height;
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
            // If we do not have a height but we do have a chunk then unset
            // the chunk. Next time we see a height we’ll want to create a
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
    }

    // The first time we flush comment heights from layout we do it
    // synchronously. Otherwise React will yield to the browser which will
    // show the comment shimmers to the user which will immediately flash out of
    // existence when we re-render with the actual comments.
    //
    // To avoid the flash of comment shimmers we schedule a synchronous flush.
    // This may cause us to drop animation frames, but the tradeoff is worth it.
    // We’d much rather avoid the flash if we can.
    if (pendingCommentHeights.important === true) {
      reactSchedulerFlushSync(() => this.setState(updateState));
    } else {
      this.setState(updateState);
    }
  }

  // Memoize the filler view.
  private renderFiller = memoizeLast(renderFiller);

  // Memoize each individual item in a cache so we don’t have to recompute it
  // every time. By wrapping a `memoize()` function in a `memoizeLast()` it has
  // the effect of clearing the `memoize()` cache whenever the `memoizeLast()`
  // parameters change.
  private renderItem = memoizeLast(
    (
      comments: ReadonlyArray<PostCommentsCacheEntry | undefined>,
      commentChunks: ReadonlyArray<CommentChunk>,
      commentHeights: ReadonlyArray<number | undefined>,
    ) =>
      memoize((index: number) =>
        renderItem(
          this.handleCommentLayout, // We know this event handler is constant in our class.
          this.props.scrollViewRef, // Refs are constant objects that are changed via imperative mutation.
          comments,
          commentChunks,
          commentHeights,
          index,
        ),
      ),
  );

  render() {
    const commentCount = this.props.commentCount;
    const actualVisibleRange: RenderRange = this.state.visibleRange;

    // Add overscan to the visible range. We render more comments off-screen
    // but we don’t report them in our visible range state.
    let visibleRange: RenderRange = {
      first: Math.max(actualVisibleRange.first - overscanCount, 0),
      last: Math.min(actualVisibleRange.last + overscanCount, commentCount),
    };

    // We always render some items at the very beginning of the list so that
    // “jump to start” are perceived to render quickly.
    let leadingRange: RenderRange | null = {
      first: 0,
      last: Math.min(leadingCount, commentCount),
    };

    // We always render some items at the very end of the list so that
    // “jump to start” are perceived to render quickly.
    let trailingRange: RenderRange | null = {
      first: Math.max(0, commentCount - trailingCount),
      last: commentCount,
    };

    // Merge the leading range with the visible range if needed.
    if (intersects(visibleRange, leadingRange)) {
      visibleRange = {
        first: Math.min(visibleRange.first, leadingRange.first),
        last: Math.max(visibleRange.last, leadingRange.last),
      };
      leadingRange = null;
    }

    // Merge the trailing range with the visible range if needed.
    if (intersects(visibleRange, trailingRange)) {
      visibleRange = {
        first: Math.min(visibleRange.first, trailingRange.first),
        last: Math.max(visibleRange.last, trailingRange.last),
      };
      trailingRange = null;
    }

    const items: Array<ReactElement> = [];

    // Get the render item function based on our state. The render item function
    // is memoized so it comes with a cache.
    const renderItem = this.renderItem(
      this.props.comments,
      this.state.commentChunks,
      this.state.commentHeights,
    );

    // If we have a leading range then render the items in our leading range.
    if (leadingRange) {
      for (let i = 0; i < leadingRange.last - leadingRange.first; i++) {
        items.push(renderItem(leadingRange.first + i));
      }
    }

    // Render the items in our visible range.
    for (let i = 0; i < visibleRange.last - visibleRange.first; i++) {
      items.push(renderItem(visibleRange.first + i));
    }

    // If we have a trailing range then render the items in our trailing range.
    if (trailingRange) {
      for (let i = 0; i < trailingRange.last - trailingRange.first; i++) {
        items.push(renderItem(trailingRange.first + i));
      }
    }

    return (
      <View onLayout={this.handleContainerLayout}>
        {this.renderFiller(
          this.state.commentChunks,
          this.state.commentHeights,
          this.props.commentCount,
        )}
        {items}
      </View>
    );
  }
}

/**
 * Gets the offset above the item at a given index.
 *
 * The dual of this function is `getIndex()` where we can get an index from
 * an offset.
 */
function getOffset(
  commentChunks: ReadonlyArray<CommentChunk>,
  commentHeights: ReadonlyArray<number | undefined>,
  maxIndex: number,
): number {
  // Set the initial offset and index. The offset is a distance in measurement
  // units. The index is a position in our comments list.
  let offset = 0;
  let index = 0;

  // Loop through our comment chunks...
  for (let i = 0; i < commentChunks.length; i++) {
    const commentChunk = commentChunks[i];

    // We expect `commentChunks` to be sorted by `commentChunk.index` and we
    // expect that `index` will never exceed the next comment chunk’s starting
    // position based on our implementation below. If these expectations are
    // violated then throw.
    if (index > commentChunk.start) {
      throw new Error(
        `Expected ${index} to be less than or equal to ${commentChunk.start}.`,
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
      const height = commentHeights[index];
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
function getIndex(
  commentChunks: ReadonlyArray<CommentChunk>,
  commentHeights: ReadonlyArray<number | undefined>,
  maxOffset: number,
): number {
  // Set the initial offset and index. The offset is a distance in measurement
  // units. The index is a position in our comments list.
  let offset = 0;
  let index = 0;

  // Loop through our comment chunks...
  for (let i = 0; i < commentChunks.length; i++) {
    const commentChunk = commentChunks[i];

    // We expect `commentChunks` to be sorted by `commentChunk.index` and we
    // expect that `index` will never exceed the next comment chunk’s starting
    // position based on our implementation below. If these expectations are
    // violated then throw.
    if (index > commentChunk.start) {
      throw new Error(
        `Expected ${index} to be less than or equal to ${commentChunk.start}.`,
      );
    }

    // Measure the height of comment shimmers between our current index and the
    // start of the next chunk.
    const shimmerHeight = CommentShimmer.getHeight(
      commentChunk.start - index,
      index,
    );

    // If adding the shimmers will surpass the max offset, then let’s get our
    // specific index inside the shimmers and break out of the comment
    // chunk loop.
    if (offset + shimmerHeight >= maxOffset) {
      index += CommentShimmer.getIndex(maxOffset - offset, index);
      offset = maxOffset;
      break;
    }

    // Add our shimmer height and update our index to the chunk’s
    // starting position.
    offset += shimmerHeight;
    index = commentChunk.start;

    // If increasing the offset by the comment chunk length puts us above our
    // desired offset then we move backwards through the comment list to
    // arrive at the correct index.
    if (offset + commentChunk.height >= maxOffset) {
      while (offset < maxOffset) {
        const height = commentHeights[index];
        if (height === undefined) throw new Error("Expected height.");
        offset += height;
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

/**
 * Renders the filler space for the entire list.
 *
 * We implement this outside of the component class so that we’re forced to
 * explicitly declare all of our dependencies. That way a memoization function
 * can correctly determine when the result should change.
 */
function renderFiller(
  commentChunks: ReadonlyArray<CommentChunk>,
  commentHeights: ReadonlyArray<number | undefined>,
  commentCount: number,
) {
  const height =
    getOffset(commentChunks, commentHeights, commentCount) + Space.space3;
  return <View style={{height}} />;
}

/**
 * Renders an individual comment in the entire comment list.
 *
 * We implement this outside of the component class so that we’re forced to
 * explicitly declare all of our dependencies. That way a memoization function
 * can correctly determine when the result should change.
 */
function renderItem(
  handleCommentLayout: HandleCommentLayout,
  scrollViewRef: React.RefObject<ScrollView>,
  comments: ReadonlyArray<PostCommentsCacheEntry | undefined>,
  commentChunks: ReadonlyArray<CommentChunk>,
  commentHeights: ReadonlyArray<number | undefined>,
  index: number,
): ReactElement {
  const comment = comments[index];
  const lastComment = comments[index - 1];
  const commentHeight = commentHeights[index];
  const offset = getOffset(commentChunks, commentHeights, index);

  // On web, use a `div` directly which is more efficient since we don’t
  // need the extra component.
  const ViewComponent = Platform.OS === "web" ? "div" : View;

  return (
    <React.Fragment key={index}>
      {comment !== undefined && (
        <View
          style={{
            position: "absolute",
            top: offset,
            left: 0,
            right: 0,
            opacity: commentHeight === undefined ? 0 : 1,
          }}
          onLayout={event => handleCommentLayout(index, comment, event)}
        >
          <Comment
            commentID={comment.id}
            lastCommentID={lastComment !== undefined ? lastComment.id : null}
            realtime={comment.realtime}
            scrollViewRef={scrollViewRef}
          />
        </View>
      )}
      {(comment === undefined || commentHeight === undefined) && (
        <ViewComponent
          style={{
            position: "absolute",
            top: offset,
            left: 0,
            right: 0,
          }}
        >
          <CommentShimmer index={index} />
        </ViewComponent>
      )}
    </React.Fragment>
  );
}

type HandleCommentLayout = (
  index: number,
  comment: PostCommentsCacheEntry,
  event: LayoutChangeEvent,
) => void;

/**
 * Do the two ranges intersect with one another? Returns true if they intersect.
 */
function intersects(a: RenderRange, b: RenderRange): boolean {
  return !(a.last < b.first || b.last < a.first);
}

/**
 * Caches the last result of a function. If the function is immediately called
 * again with the same arguments then we will re-use the last result without
 * calling the function again.
 */
function memoizeLast<Args extends Array<any>, Ret>(
  fn: (...args: Args) => Ret,
): (...args: Args) => Ret {
  // The internal cache of our memoization function.
  let cache: {args: Args; ret: Ret} | null = null;

  return (...args: Args): Ret => {
    // If we have a previous cached value...
    if (cache !== null) {
      let equal = true;

      // Determine if the argument arrays are equal...
      if (args.length !== cache.args.length) {
        equal = false;
      } else {
        for (let i = 0; i < args.length; i++) {
          if (args[i] !== cache.args[i]) {
            equal = false;
            break;
          }
        }
      }

      // If the argument arrays are equal then return our cached value.
      if (equal === true) {
        return cache.ret;
      }
    }

    // Otherwise compute the return value and cache the result.
    const ret = fn(...args);
    cache = {args, ret};
    return ret;
  };
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

// Export some of our utility functions for testing.
export {getIndex as test_getIndex};

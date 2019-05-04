import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from "react-native";
import {Font, Space} from "../atoms";
import React, {ReactElement} from "react";
import {CommentShimmer} from "../comment/CommentShimmer";
import {Post} from "@connect/api-client";

// The number of items to render outside of the viewport range.
const overscanCount = 1;

type Props = {
  post: Post;

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
   * The currently visible range of items. When we update the visible range we
   * also re-render the items list.
   */
  visibleRange: {
    first: number;
    last: number;
    items: ReadonlyArray<ReactElement>;
  };
};

export class PostVirtualizedComments extends React.Component<Props, State> {
  /**
   * The expected scroll event throttle for our component.
   */
  static scrollEventThrottle = 50;

  private lastScroll: null | {timestamp: number; offset: number} = null;

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
        items: this.renderItems(first, last),
      },
    };
  }

  componentDidMount() {
    // HACK: Set our scroll handler to the mutable ref. This is how we “pass up”
    // our event handler.
    this.props.onScroll.current = this.handleScroll;
  }

  componentWillUnmount() {
    this.props.onScroll.current = null;
  }

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
    let first = CommentShimmer.getIndex(firstOffset) - 1 - overscanCount;
    if (first < 0) first = 0;

    // Get the ending index of visible items.
    let last = CommentShimmer.getIndex(lastOffset) + overscanCount;
    if (last > commentCount) last = commentCount;

    // Get the new array of items. We will set that in state too so we don’t
    // have to do it in render.
    const items = this.renderItems(first, last);

    // Update the visible range if it changed.
    this.setState(prevState => {
      if (
        prevState.visibleRange.first === first &&
        prevState.visibleRange.last === last
      ) {
        return;
      }
      return {visibleRange: {first, last, items}};
    });
  };

  private renderFiller = memoizeLast((post: Post) => {
    const height = CommentShimmer.getHeight(post.commentCount) + Space.space3;
    return <View style={{height}} />;
  });

  private renderItem = memoize(
    (index: number): ReactElement => {
      const ViewComponent = Platform.OS === "web" ? "div" : View;
      return (
        <ViewComponent
          key={index}
          style={{
            position: "absolute",
            top: CommentShimmer.getHeight(index),
            left: 0,
            right: 0,
          }}
        >
          <CommentShimmer index={index} />
        </ViewComponent>
      );
    },
  );

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

  render() {
    const {post} = this.props;
    const {visibleRange} = this.state;

    return (
      <>
        {this.renderFiller(post)}
        {visibleRange.items}
      </>
    );
  }
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

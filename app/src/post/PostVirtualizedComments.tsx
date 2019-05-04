import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

  private handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const commentCount = this.props.post.commentCount;

    // Get the range of visible content in the scroll view from the event.
    const offset = event.nativeEvent.contentOffset.y;
    const viewport = event.nativeEvent.layoutMeasurement.height;

    // Get the beginning index of visible items.
    let first = CommentShimmer.getIndex(offset) - 1 - overscanCount;
    if (first < 0) first = 0;

    // Get the ending index of visible items.
    let last = CommentShimmer.getIndex(offset + viewport) + overscanCount;
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
      return (
        <View
          key={index}
          style={{
            position: "absolute",
            top: CommentShimmer.getHeight(index),
            left: 0,
            right: 0,
          }}
        >
          <CommentShimmer index={index} />
        </View>
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

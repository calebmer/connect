import {Border, Font} from "../atoms";
import {StyleSheet} from "react-native";
import {createDivElement} from "../utils/forks/createDivElement";

/**
 * A shimmer for a line of text with a given percentage width. (The percentage
 * is out of 100.)
 *
 * While you may render this component like any other, you are also able to call
 * the component directly which is useful if you want to memoize the result.
 */
export function TextShimmer({width}: {width: number}) {
  return createDivElement({
    style: [styles.line, {width: `${width}%`}],
  });
}

TextShimmer.shimmerColor = "hsl(0, 0%, 94%)"; // `Color.grey0` is too light and `Color.grey1` is too dark
TextShimmer.lineBarHeight = Font.size2.fontSize * 0.6;

const styles = StyleSheet.create({
  line: {
    height: TextShimmer.lineBarHeight,
    marginVertical: (Font.size2.lineHeight - TextShimmer.lineBarHeight) / 2,
    backgroundColor: TextShimmer.shimmerColor,
    borderRadius: Border.radius0,
  },
});

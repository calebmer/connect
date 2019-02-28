/**
 * The design system for our UI.
 *
 * ## Personality
 *
 * The personality of our design system can be described as **“smart yet fun”**.
 *
 * Unlike other social media platforms, we want to hammer in that this is where
 * _smart_ conversations happen. We also want to keep it light, though. This is
 * the platform where Twitch streamers should feel at home hosting
 * their community.
 *
 * We also want a bit of a classic feel to the design. We’re reinventing
 * communication by taking it back to a much more personal level.
 *
 * ## Usage
 *
 * Whenever we need to pick color, padding, margin, or any arbitrary styled
 * value we use a value from our design system instead of picking a random
 * number. This way our design looks consistent and polished.
 *
 * We export the `$` style sheet which allows for quick access to all of our
 * atomic design styles. With any luck you’ll never need to use the React Native
 * `StyleSheet` since you’ll have all the styles you need here.
 */

import {StyleSheet} from "react-native";

/**
 * Our font scale. Hand picked based on common font sizes around what we will
 * need in our interface. When picking a font size only use a value from
 * this scale!
 */

const fontSizeExtraSmall = 12;
const fontSizeSmall = 14;
const fontSizeBase = 16;
const fontSizeMedium = 18;
const fontSizeLarge = 24;
const fontSizeExtraLarge = 36;

/**
 * For body text we use the serif font [Freight Text][1].
 *
 * We’re bringing serifs back, yo! But seriously, typography plays a huge role
 * in determining how a design feels. We want to feel different from all the
 * current digital communication platforms, because we are. All modern digital
 * communication platforms use sans-serif fonts. We want to harken back to a
 * more classic communication platform. Books.
 *
 * The choice of a serif font might make communication feel _too_ serious. We
 * definitely don’t want that. Gotta keep it light.
 *
 * To add support for this font to a web page, add this to the `<head>`:
 *
 * ```html
 * <link rel="stylesheet" href="https://use.typekit.net/yno3yns.css" />
 * ```
 *
 * [1]: https://fonts.adobe.com/fonts/freight-text
 */
export const bodyFontFamily = "freight-text-pro, serif";
const bodyFontSize = fontSizeBase;
const bodyFontWeight = "400";
const bodyFontStyle = "normal";
const bodyLineHeight = 24; // bodyFontSize * 1.5
const bodyMaxWidth = 512; // bodyFontSize * 32

const titleFontFamily = "freight-sans-pro, sans-serif";
const titleFontSize = fontSizeLarge;
const titleFontWeight = "700";
const titleFontStyle = "normal";
const titleLineHeight = 24; // titleFontSize * 1 === bodyLineHeight

const metaFontFamily = "freight-sans-pro, sans-serif";
const metaFontSize = fontSizeSmall;
const metaFontStyle = "normal";
const metaFontWeight = "400";
const metaLineHeight = bodyLineHeight;

const labelFontFamily = "freight-text-pro, serif";
const labelFontSize = fontSizeBase;
const labelFontWeight = "700";
const labelFontStyle = "normal";
const labelLineHeight = 24; // bodyFontSize * 1.5

export const $ = StyleSheet.create({
  /**
   * Typography style presets.
   */

  bodyText: {
    fontFamily: bodyFontFamily,
    fontSize: bodyFontSize,
    fontWeight: bodyFontWeight,
    fontStyle: bodyFontStyle,
    lineHeight: bodyLineHeight,

    // We include the max width in our body text styles because we absolutely
    // want to make sure that the body text never gets wider then this. Layouts
    // should also be responsible for making sure text never exceeds this width.
    maxWidth: bodyMaxWidth,
  },

  titleText: {
    fontFamily: titleFontFamily,
    fontSize: titleFontSize,
    fontWeight: titleFontWeight,
    fontStyle: titleFontStyle,
    lineHeight: titleLineHeight,
  },

  metaText: {
    fontFamily: metaFontFamily,
    fontSize: metaFontSize,
    fontWeight: metaFontWeight,
    fontStyle: metaFontStyle,
    lineHeight: metaLineHeight,
  },

  labelText: {
    fontFamily: labelFontFamily,
    fontSize: labelFontSize,
    fontWeight: labelFontWeight,
    fontStyle: labelFontStyle,
    lineHeight: labelLineHeight,
  },
});

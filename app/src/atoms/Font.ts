import {Platform} from "react-native";

const fontSmoothing =
  Platform.OS === "web"
    ? {
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }
    : {};

// Font families and variations:
export const serif = {
  fontFamily: "'Merriweather', serif",
  fontWeight: "400" as "400",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};
export const serifBold = {
  fontFamily: "'Merriweather', serif",
  fontWeight: "700" as "700",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};
export const serifItalic = {
  fontFamily: "'Merriweather', serif",
  fontWeight: "400" as "400",
  fontStyle: "italic" as "italic",
  ...fontSmoothing,
};
export const serifBoldItalic = {
  fontFamily: "'Merriweather', serif",
  fontWeight: "700" as "700",
  fontStyle: "italic" as "italic",
  ...fontSmoothing,
};
export const sans = {
  fontFamily: "'Work Sans', sans-serif",
  fontWeight: "400" as "400",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};
export const sansBold = {
  fontFamily: "'Work Sans', sans-serif",
  fontWeight: "700" as "700",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};

// Type size scale:
export const size0 = {
  fontSize: 12,
  lineHeight: 18,
};
export const size1 = {
  fontSize: 14,
  lineHeight: 21,
};
export const size2 = {
  fontSize: 16,
  lineHeight: 24,
};
export const size3 = {
  fontSize: 18,
  lineHeight: 24,
};
export const size4 = {
  fontSize: 24,
  lineHeight: 24,
};
export const size5 = {
  fontSize: 36,
  lineHeight: 36,
};

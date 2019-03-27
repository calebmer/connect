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
  fontFamily: "Faustina",
  fontWeight: "400" as "400",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};
export const serifBold = {
  fontFamily: "Faustina",
  fontWeight: "700" as "700",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};
export const serifItalic = {
  fontFamily: "Faustina",
  fontWeight: "400" as "400",
  fontStyle: "italic" as "italic",
  ...fontSmoothing,
};
export const serifBoldItalic = {
  fontFamily: "Faustina",
  fontWeight: "700" as "700",
  fontStyle: "italic" as "italic",
  ...fontSmoothing,
};
export const sans = {
  fontFamily: "Work Sans",
  fontWeight: "400" as "400",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};
export const sansBold = {
  fontFamily: "Work Sans",
  fontWeight: "700" as "700",
  fontStyle: "normal" as "normal",
  ...fontSmoothing,
};

// Type size scale:
export const size0 = {
  fontSize: 13,
  lineHeight: 18,
};
export const size1 = {
  fontSize: 15,
  lineHeight: 24,
};
export const size2 = {
  fontSize: 17,
  lineHeight: 24,
};
export const size3 = {
  fontSize: 19,
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
export const size6 = {
  fontSize: 48,
  lineHeight: 48,
};

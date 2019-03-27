import {Platform} from "react-native";

// TODO: Android elevation.

export const elevation0 = {
  shadowOffset: {width: 0, height: 1},
  shadowRadius: Platform.OS === "ios" ? 2 : 3,
  shadowColor: "black",
  shadowOpacity: 0.16,
};

export const elevation1 = {
  shadowOffset: {width: 0, height: 2},
  shadowRadius: 4,
  shadowColor: "black",
  shadowOpacity: 0.2,
};

export const elevation3 = {
  shadowOffset: {width: 0, height: 4},
  shadowRadius: 12,
  shadowColor: "black",
  shadowOpacity: 0.2,
};

import {Platform} from "react-native";

// TODO: Android elevation.

export const elevation0 = Platform.select({
  ios: {
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 3,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
  web: {
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 3,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
});

export const elevation1 = Platform.select({
  ios: {
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
  web: {
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 8,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
});

export const elevation2 = Platform.select({
  ios: {
    shadowOffset: {width: 0, height: 5},
    shadowRadius: 15,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
  web: {
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 17,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
});

export const elevation3 = Platform.select({
  ios: {
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 24,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
  web: {
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 24,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
});

export const elevation4 = Platform.select({
  ios: {
    shadowOffset: {width: 0, height: 15},
    shadowRadius: 35,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
  web: {
    shadowOffset: {width: 0, height: 15},
    shadowRadius: 35,
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
});

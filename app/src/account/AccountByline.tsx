import {AccountProfile, DateTime} from "@connect/api-client";
import {LabelText, MetaText} from "../atoms";
import {Platform, StyleSheet, View} from "react-native";
import React from "react";
import {communicateTime} from "../utils/communicateTime";

export function AccountByline({
  account,
  time: _time,
}: {
  account: AccountProfile;
  time: DateTime;
}) {
  // NOTE: It’s a side-effect to call `new Date()` in render! Ideally, we would
  // have a hook that subscribes to the system time and re-renders this
  // component when it changes. At the moment, it’s not a big issue. This
  // component is memoized anyway so the current date only changes when
  // the props change.
  const time = communicateTime(new Date(), new Date(_time));

  return (
    <View style={styles.byline}>
      <LabelText>{account.name}</LabelText>
      <MetaText style={styles.time}>{time}</MetaText>
    </View>
  );
}

const styles = StyleSheet.create({
  byline: {
    flexDirection: "row",

    // NOTE: `baseline` doesn’t work very well outside of web. Super sad!
    alignItems: Platform.OS === "web" ? "baseline" : undefined,
  },
  time: {
    marginLeft: 6,
    ...Platform.select({
      web: {},
      default: {
        // NOTE: Manually align to the baseline since `alignItems: "baseline"`
        // doesn’t do it.
        bottom: -4.8,
      },
    }),
  },
});

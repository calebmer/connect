import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BodyText, bodyLineHeight } from "./Text";
import { ProfileImage } from "./ProfileImage";

export function Message() {
  return (
    <View style={styles.container}>
      <ProfileImage />
      <BodyText>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
        vulputate nibh ipsum, eget sollicitudin enim dignissim a. Donec vel
        tempor elit, blandit maximus sapien. Curabitur vel massa vestibulum,
        rutrum libero ut, vehicula enim. Cras rhoncus id augue sed efficitur.
        Praesent sodales leo eget dapibus pharetra. Donec sed urna nec lorem
        tincidunt rhoncus non ut tortor. Quisque sodales orci congue maximus
        dictum. Nam id tincidunt enim. Proin nec justo nunc. Nam aliquam
        venenatis lorem, condimentum blandit orci lobortis sodales. Sed vitae
        neque mattis, sollicitudin dolor non, vestibulum justo. In quis magna
        ex. Fusce aliquet, urna quis imperdiet dignissim, turpis est placerat.
      </BodyText>
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: bodyLineHeight,
    // paddingHorizontal: bodyLineHeight * 0.8,
  },
});

import "react-native";
import {Button} from "../Button";
import React from "react";

// Note: test renderer must be required after react-native.
import renderer from "react-test-renderer";

test("renders correctly", () => {
  renderer.create(<Button label="Button" onPress={() => {}} />);
});

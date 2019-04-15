import React, {useState} from "react";
import {IconName} from "./atoms";
import {IconPatch} from "./IconPatch";
import {TouchableWithoutFeedback} from "react-native";

export function IconPatchButton({
  icon,
  disabled,
  onPress,
}: {
  icon: IconName;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const active = pressed;

  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <IconPatch
        icon={icon}
        theme={disabled ? "disabled" : active ? "primary-active" : "primary"}
      />
    </TouchableWithoutFeedback>
  );
}

// Touchable area should be at least 44x44.
const hitSlop = {
  top: (44 - IconPatch.size) / 2,
  bottom: (44 - IconPatch.size) / 2,
  left: (44 - IconPatch.size) / 2,
  right: (44 - IconPatch.size) / 2,
};

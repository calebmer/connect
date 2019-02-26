import * as React from "react";
import { BodyText } from "./Text";
import { ProfileSignature } from "./ProfileSignature";

export function Message({
  name,
  image,
  message,
  time,
}: {
  name: string;
  image: string;
  message: string;
  time: string;
}) {
  return (
    <ProfileSignature name={name} image={image} time={time}>
      <BodyText>{message}</BodyText>
    </ProfileSignature>
  );
}

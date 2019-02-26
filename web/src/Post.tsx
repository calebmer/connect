import * as React from "react";
import { ProfileSignature } from "./ProfileSignature";

export function Post({
  name,
  image,
  time,
}: {
  name: string;
  image: string;
  time: string;
}) {
  return (
    <ProfileSignature name={name} image={image} time={time}>
      {null}
    </ProfileSignature>
  );
}

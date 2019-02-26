import * as React from "react";
import { BodyText } from "./Text";
import { Signature } from "./Signature";

export function Message() {
  return (
    <Signature>
      <BodyText>
        and on press next on page3, you would manipulate state to change page#
        or any other variable that would then make it show page 4. same for page
        5. now if someone presses back on any of 3,4,5, they would end up on
        page 2
      </BodyText>
    </Signature>
  );
}

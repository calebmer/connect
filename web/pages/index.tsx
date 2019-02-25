import * as React from "react";
import { Message } from "../components/Message";
import { GridWireFrame } from "../components/GridWireFrame";

export default function IndexPage() {
  return (
    <GridWireFrame>
      <Message />
    </GridWireFrame>
  );
}

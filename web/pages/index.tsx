import * as React from "react";
import { Message } from "../src/Message";
import { GridWireFrame } from "../src/GridWireFrame";

export default function IndexPage() {
  return (
    <>
      {/* <GridWireFrame> */}
      <Message />
      <Message />
      <Message />
      {/* </GridWireFrame> */}
    </>
  );
}

import * as React from "react";
import { MessageList } from "../src/MessageList";
import { GridWireFrame } from "../src/GridWireFrame";

export default function IndexPage() {
  return (
    <>
      <GridWireFrame>
        <MessageList messages={[{ id: 1 }, { id: 2 }, { id: 3 }]} />
      </GridWireFrame>
    </>
  );
}

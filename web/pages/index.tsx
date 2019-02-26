import * as React from "react";
import { MessageList } from "../src/MessageList";
import { GridWireFrame } from "../src/GridWireFrame";

export default function IndexPage() {
  return (
    <>
      <GridWireFrame>
        <MessageList
          messages={[
            {
              id: 1,
              name: "Baruch Hen",
              message:
                "@dpgozza @Joseph Collins what do you guys use to manage state across your app (react native)",
              time: "5:40 AM",
            },
            {
              id: 2,
              name: "Joseph Collins",
              message:
                "Right now redux because the Context API only just got released and it isnt currently stable",
              time: "5:43 AM",
            },
            {
              id: 3,
              name: "Joseph Collins",
              message:
                "Well hooks that is, I think context has been fine but Im waiting for hooks and context together first.",
              time: "5:43 AM",
            },
            {
              id: 4,
              name: "Dominic Gozza",
              message: "I want to use hooks & context so bad",
              time: "5:44 AM",
            },
            {
              id: 5,
              name: "Dominic Gozza",
              message:
                "Things may of changed as of today I'll link you to the github tracking",
              time: "5:44 AM",
            },
            {
              id: 6,
              name: "Baruch Hen",
              message: "I'm using expo for now, and that means no hooks yet",
              time: "5:45 AM",
            },
            {
              id: 7,
              name: "Dominic Gozza",
              message: "yup",
              time: "5:45 AM",
            },
            {
              id: 8,
              name: "Dominic Gozza",
              message: "To be noted I like expo",
              time: "5:45 AM",
            },
            {
              id: 9,
              name: "Joseph Collins",
              message:
                "I don’t use expo as I tend to have to write custom java/objective-c modules for a lot of our scanning software here.",
              time: "5:45 AM",
            },
            {
              id: 10,
              name: "Joseph Collins",
              message: "So easier to not have to worry about ejecting for me",
              time: "5:46 AM",
            },
            {
              id: 11,
              name: "Baruch Hen",
              message:
                "I'm planning on ejecting probably by the end of this week tbh, there are too many things (functionality wise) that I'm missing with expo since the modules are not compatible",
              time: "6:14 AM",
            },
          ]}
        />
      </GridWireFrame>
    </>
  );
}

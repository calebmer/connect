import * as React from "react";
import {ScrollView} from "react-native";
import {GridWireFrame} from "../src/GridWireFrame";
import {Post} from "../src/Post";

const showGrid = false;

export default function IndexPage() {
  const body = (
    <>
      <Post
        name="Baruch Hen"
        image="https://pbs.twimg.com/profile_images/1022636637891776512/vCciX6oJ_400x400.jpg"
        content="Dominic Gozza, Joseph Collins: what do you guys use to manage state across your app (react native)"
        time="5:40 AM"
        comments={[
          {
            id: 2,
            name: "Joseph Collins",
            image:
              "https://images-na.ssl-images-amazon.com/images/M/MV5BMTc3MzY3MjQ3OV5BMl5BanBnXkFtZTcwODI3NjQxMw@@._V1_UY256_CR6,0,172,256_AL_.jpg",
            message:
              "Right now redux because the Context API only just got released and it isnt currently stable",
            time: "5:43 AM",
          },
          {
            id: 3,
            name: "Joseph Collins",
            image:
              "https://images-na.ssl-images-amazon.com/images/M/MV5BMTc3MzY3MjQ3OV5BMl5BanBnXkFtZTcwODI3NjQxMw@@._V1_UY256_CR6,0,172,256_AL_.jpg",
            message:
              "Well hooks that is, I think context has been fine but Im waiting for hooks and context together first.",
            time: "5:43 AM",
          },
          {
            id: 4,
            name: "Dominic Gozza",
            image:
              "https://pbs.twimg.com/profile_images/847609679974768641/WDwlVYbD_400x400.jpg",
            message: "I want to use hooks & context so bad",
            time: "5:44 AM",
          },
          {
            id: 5,
            name: "Dominic Gozza",
            image:
              "https://pbs.twimg.com/profile_images/847609679974768641/WDwlVYbD_400x400.jpg",
            message:
              "Things may of changed as of today I'll link you to the github tracking",
            time: "5:44 AM",
          },
          {
            id: 6,
            name: "Baruch Hen",
            image:
              "https://pbs.twimg.com/profile_images/1022636637891776512/vCciX6oJ_400x400.jpg",
            message: "I'm using expo for now, and that means no hooks yet",
            time: "5:45 AM",
          },
          {
            id: 7,
            name: "Dominic Gozza",
            image:
              "https://pbs.twimg.com/profile_images/847609679974768641/WDwlVYbD_400x400.jpg",
            message: "yup",
            time: "5:45 AM",
          },
          {
            id: 8,
            name: "Dominic Gozza",
            image:
              "https://pbs.twimg.com/profile_images/847609679974768641/WDwlVYbD_400x400.jpg",
            message: "To be noted I like expo",
            time: "5:45 AM",
          },
          {
            id: 9,
            name: "Joseph Collins",
            image:
              "https://images-na.ssl-images-amazon.com/images/M/MV5BMTc3MzY3MjQ3OV5BMl5BanBnXkFtZTcwODI3NjQxMw@@._V1_UY256_CR6,0,172,256_AL_.jpg",
            message:
              "I don’t use expo as I tend to have to write custom java/objective-c modules for a lot of our scanning software here.",
            time: "5:45 AM",
          },
          {
            id: 10,
            name: "Joseph Collins",
            image:
              "https://images-na.ssl-images-amazon.com/images/M/MV5BMTc3MzY3MjQ3OV5BMl5BanBnXkFtZTcwODI3NjQxMw@@._V1_UY256_CR6,0,172,256_AL_.jpg",
            message: "So easier to not have to worry about ejecting for me",
            time: "5:46 AM",
          },
          {
            id: 11,
            name: "Baruch Hen",
            image:
              "https://pbs.twimg.com/profile_images/1022636637891776512/vCciX6oJ_400x400.jpg",
            message:
              "I'm planning on ejecting probably by the end of this week tbh, there are too many things (functionality wise) that I'm missing with expo since the modules are not compatible",
            time: "6:14 AM",
          },
        ]}
      />
    </>
  );
  return (
    <ScrollView>
      {showGrid ? <GridWireFrame>{body}</GridWireFrame> : body}
    </ScrollView>
  );
}

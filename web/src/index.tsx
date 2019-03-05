import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

import {AppRegistry} from "react-native";
import {SignIn} from "@connect/app";

AppRegistry.registerComponent("SignIn", () => SignIn);
AppRegistry.runApplication("SignIn", {
  rootTag: document.getElementById("react-root"),
});

// ReactDOM.render(<App />, document.getElementById("root"));

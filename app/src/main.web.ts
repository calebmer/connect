// Import all our routes for the initialization side-effects.
import "./router/AllRoutes";

import {App} from "./App.web";
import {AppRegistry} from "react-native";

AppRegistry.registerComponent("Connect", () => App);
AppRegistry.runApplication("Connect", {
  rootTag: document.getElementById("root"),
});

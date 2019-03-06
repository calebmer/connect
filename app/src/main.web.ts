// Import all our routes for the initialization side-effects.
import "./router/AllRoutes";

import {App} from "./App.web";
import {AppRegistry} from "react-native";

declare const document: any;

AppRegistry.registerComponent("App", () => App);
AppRegistry.runApplication("App", {
  rootTag: document.getElementById("root"),
});

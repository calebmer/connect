import {App} from "./App";
import {AppRegistry} from "react-native";

declare const document: any;

AppRegistry.registerComponent("App", () => App);
AppRegistry.runApplication("App", {
  rootTag: document.getElementById("root"),
});

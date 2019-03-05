import {AppRegistry} from "react-native";
import {App} from "./App";

declare const document: any;

AppRegistry.registerComponent("App", () => App);
AppRegistry.runApplication("App", {
  rootTag: document.getElementById("root"),
});

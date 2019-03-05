import {Navigation} from "react-native-navigation";
import {SignIn} from "./SignIn";
import {SignUp} from "./SignUp";

Navigation.registerComponent("connect.SignIn", () => SignIn);
Navigation.registerComponent("connect.SignUp", () => SignUp);

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      stack: {
        options: {
          // There should be no top bar when the user is signing in.
          topBar: {visible: false},
        },
        children: [{component: {name: "connect.SignIn"}}],
      },
    },
  });
});

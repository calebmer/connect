import {Navigation} from "react-native-navigation";
import {SignInRoute} from "./router";

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      stack: {
        options: {
          // There should be no top bar when the user is signing in.
          topBar: {visible: false},
        },
        children: [(SignInRoute as any).getLayout({})],
      },
    },
  });
});

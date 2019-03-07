import {GroupRoute, SignInRoute} from "./router";
import {Navigation} from "react-native-navigation";

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      stack: {
        options: {
          // There should be no top bar when the user is signing in.
          topBar: {visible: false},
        },
        children: [(GroupRoute as any).getLayout({})],
      },
    },
  });
});

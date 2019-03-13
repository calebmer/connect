import {Navigation} from "react-native-navigation";
import {SignInRoute} from "./router/AllRoutes";

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setDefaultOptions({
    topBar: {
      visible: false,
    },
  });

  Navigation.setRoot({
    root: {
      stack: {
        children: [(SignInRoute as any).getLayout({})],
      },
    },
  });
});

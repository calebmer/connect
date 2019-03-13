import {GroupRoute} from "./router/AllRoutes";
import {Navigation} from "react-native-navigation";

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setDefaultOptions({
    topBar: {
      visible: false,
    },
  });

  Navigation.setRoot({
    root: {
      stack: {
        children: [(GroupRoute as any).getLayout({})],
      },
    },
  });
});
